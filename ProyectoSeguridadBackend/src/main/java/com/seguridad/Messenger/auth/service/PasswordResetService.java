package com.seguridad.Messenger.auth.service;

import com.seguridad.Messenger.auth.dto.RespuestaGenericaResponse;
import com.seguridad.Messenger.auth.model.PasswordResetToken;
import com.seguridad.Messenger.auth.repository.DispositivoSesionRepository;
import com.seguridad.Messenger.auth.repository.PasswordResetTokenRepository;
import com.seguridad.Messenger.shared.service.EmailService;
import com.seguridad.Messenger.shared.util.TokenGenerator;
import com.seguridad.Messenger.usuario.model.Usuario;
import com.seguridad.Messenger.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PasswordResetService {

    /** Respuesta única para "forgot-password" — no revela si el email existe. */
    private static final String MENSAJE_GENERICO =
            "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.";

    private static final String MENSAJE_RESET_OK =
            "Tu contraseña ha sido actualizada correctamente.";

    private static final String ASUNTO_EMAIL = "Restablece tu contraseña";

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final DispositivoSesionRepository sesionRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenGenerator tokenGenerator;
    private final EmailService emailService;

    @Value("${app.frontend.reset-password-url}")
    private String resetPasswordUrlBase;

    @Value("${app.password-reset.expiry-minutes:15}")
    private int expiryMinutes;

    // ─── Forgot ──────────────────────────────────────────────────────────────

    /**
     * Genera un token y envía email solo si el correo corresponde a un usuario activo.
     * En cualquier caso devuelve la misma respuesta para evitar enumeración. El envío
     * de correo es @Async, por lo que el tiempo de respuesta no depende del estado real.
     */
    public RespuestaGenericaResponse solicitarReset(String email) {
        usuarioRepository.findByEmail(email)
                .filter(Usuario::isActivo)
                .ifPresent(this::iniciarFlujoReset);
        return new RespuestaGenericaResponse(MENSAJE_GENERICO);
    }

    private void iniciarFlujoReset(Usuario usuario) {
        LocalDateTime ahora = LocalDateTime.now();

        tokenRepository.invalidarActivosDelUsuario(usuario.getId(), ahora);

        String tokenPlano = tokenGenerator.generarToken();
        String tokenHash = DigestUtils.sha256Hex(tokenPlano);
        LocalDateTime expira = ahora.plusMinutes(expiryMinutes);

        tokenRepository.save(new PasswordResetToken(usuario, tokenHash, ahora, expira));

        String link = resetPasswordUrlBase + "?token=" + tokenPlano;
        emailService.enviarHtml(usuario.getEmail(), ASUNTO_EMAIL, construirHtml(link));
    }

    // ─── Reset ───────────────────────────────────────────────────────────────

    public RespuestaGenericaResponse resetearPassword(String tokenPlano, String nuevaPassword) {
        String tokenHash = DigestUtils.sha256Hex(tokenPlano);

        PasswordResetToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido o expirado"));

        LocalDateTime ahora = LocalDateTime.now();
        if (!token.estaActivo(ahora)) {
            throw new IllegalArgumentException("Token inválido o expirado");
        }

        Usuario usuario = token.getUsuario();
        if (!usuario.isActivo()) {
            throw new IllegalArgumentException("Token inválido o expirado");
        }

        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);

        token.setUsadoEn(ahora);
        tokenRepository.save(token);

        // Invalida cualquier otro token activo del usuario y todas las sesiones —
        // tras un reset, el usuario debe volver a iniciar sesión en todos los dispositivos.
        tokenRepository.invalidarActivosDelUsuario(usuario.getId(), ahora);
        sesionRepository.eliminarPorUsuarioId(usuario.getId());

        return new RespuestaGenericaResponse(MENSAJE_RESET_OK);
    }

    // ─── Plantilla HTML ──────────────────────────────────────────────────────

    private String construirHtml(String link) {
        return """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <title>Restablecer contraseña</title>
                </head>
                <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:30px 0;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; padding:32px; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                          <tr>
                            <td align="center">
                              <h2 style="color:#222; margin-bottom:16px;">Restablece tu contraseña</h2>
                              <p style="color:#555; font-size:15px; line-height:1.6;">
                                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                              </p>
                              <p style="color:#555; font-size:15px; line-height:1.6;">
                                Haz clic en el siguiente botón para crear una nueva contraseña:
                              </p>
                              <a href="%s"
                                 style="display:inline-block; margin:24px 0; padding:14px 24px; background-color:#2563eb; color:#ffffff; text-decoration:none; border-radius:8px; font-size:15px; font-weight:bold;">
                                Restablecer contraseña
                              </a>
                              <p style="color:#777; font-size:13px; line-height:1.6;">
                                Este enlace expirará en %d minutos.
                              </p>
                              <p style="color:#999; font-size:12px; line-height:1.6; margin-top:24px;">
                                Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(link, expiryMinutes);
    }
}
