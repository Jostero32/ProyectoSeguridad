package com.seguridad.Messenger.auth.model;

import com.seguridad.Messenger.usuario.model.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "password_reset_token", indexes = {
        @Index(name = "ix_prt_token_hash", columnList = "token_hash", unique = true),
        @Index(name = "ix_prt_usuario_estado", columnList = "usuario_id, usado_en")
})
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** SHA-256 hex del token plano. El plano viaja al usuario por email y nunca se persiste. */
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "expira_en", nullable = false)
    private LocalDateTime expiraEn;

    @Column(name = "usado_en")
    private LocalDateTime usadoEn;

    public PasswordResetToken(Usuario usuario, String tokenHash, LocalDateTime ahora, LocalDateTime expiraEn) {
        this.usuario = usuario;
        this.tokenHash = tokenHash;
        this.creadoEn = ahora;
        this.expiraEn = expiraEn;
    }

    public boolean estaActivo(LocalDateTime ahora) {
        return usadoEn == null && expiraEn.isAfter(ahora);
    }
}
