package com.seguridad.Messenger.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Confirmación de reseteo de contraseña con el token recibido por correo")
public record ResetPasswordRequest(

        @NotBlank
        @Schema(description = "Token recibido por correo (query param del enlace)",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String token,

        @NotBlank
        @Size(min = 8)
        @JsonAlias({"newPassword", "nuevaPassword"})
        @Schema(description = "Nueva contraseña (mínimo 8 caracteres)",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String newPassword

) {}
