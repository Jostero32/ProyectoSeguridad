package com.seguridad.Messenger.websocket.controller;

import com.seguridad.Messenger.shared.security.UserPrincipal;
import com.seguridad.Messenger.usuario.repository.UsuarioRepository;
import com.seguridad.Messenger.websocket.dto.EscribiendoRequest;
import com.seguridad.Messenger.websocket.dto.PresenciaPingRequest;
import com.seguridad.Messenger.websocket.service.EscribiendoService;
import com.seguridad.Messenger.websocket.session.WebSocketSessionRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

/**
 * Recibe mensajes STOMP del cliente para el módulo de presencia.
 *
 * El cliente envía a {@code /app/escribiendo} o {@code /app/dejo-de-escribir}
 * con payload {@code {"conversacionId": "..."}}.
 * El broadcast al topic de la conversación se realiza internamente en {@link EscribiendoService}.
 */
@Controller
@RequiredArgsConstructor
public class PresenciaController {

    private final EscribiendoService escribiendoService;
    private final UsuarioRepository usuarioRepository;
    private final WebSocketSessionRegistry sessionRegistry;

    /** El usuario notifica que está escribiendo en una conversación. */
    @MessageMapping("/escribiendo")
    public void escribiendo(@Payload EscribiendoRequest req, Principal principal) {
        UUID usuarioId = ((UserPrincipal) principal).usuarioId();
        String username = usuarioRepository.findUsernameById(usuarioId);
        escribiendoService.usuarioEscribiendo(req.conversacionId(), usuarioId, username);
    }

    /** El usuario notifica explícitamente que dejó de escribir. */
    @MessageMapping("/dejo-de-escribir")
    public void dejoDeEscribir(@Payload EscribiendoRequest req, Principal principal) {
        UUID usuarioId = ((UserPrincipal) principal).usuarioId();
        String username = usuarioRepository.findUsernameById(usuarioId);
        escribiendoService.usuarioDejoDeEscribir(req.conversacionId(), usuarioId, username);
    }

    /**
     * Heartbeat de presencia.
     * visible=true/null: mantiene o activa "en línea".
     * visible=false: oculta presencia inmediatamente.
     */
    @MessageMapping("/presencia/ping")
    public void pingPresencia(@Payload(required = false) PresenciaPingRequest req, Principal principal) {
        UUID usuarioId = ((UserPrincipal) principal).usuarioId();
        boolean visible = req == null || req.visible() == null || req.visible();

        if (visible) {
            sessionRegistry.registrarHeartbeat(usuarioId);
            return;
        }

        sessionRegistry.ocultarPresencia(usuarioId);
    }
}
