package com.seguridad.Messenger.auth.repository;

import com.seguridad.Messenger.auth.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /**
     * Marca como usados todos los tokens activos del usuario.
     * Se invoca al solicitar uno nuevo (invalidación de los previos) y al consumir uno
     * (para impedir que otros tokens emitidos previamente sigan vivos).
     */
    @Modifying
    @Transactional
    @Query("""
            UPDATE PasswordResetToken t SET t.usadoEn = :ahora
            WHERE t.usuario.id = :usuarioId
              AND t.usadoEn IS NULL
              AND t.expiraEn > :ahora
            """)
    void invalidarActivosDelUsuario(@Param("usuarioId") UUID usuarioId,
                                    @Param("ahora") LocalDateTime ahora);
}
