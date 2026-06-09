package com.seguridad.Messenger.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Solicitud de recuperación de contraseña — envía un enlace de reseteo al correo si está registrado")
public record ForgotPasswordRequest(

        @NotBlank
        @Email
        @Schema(description = "Correo electrónico de la cuenta", example = "usuario@email.com",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String email

) {}
