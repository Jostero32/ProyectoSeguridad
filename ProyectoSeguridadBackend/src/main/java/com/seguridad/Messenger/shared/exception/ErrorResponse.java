package com.seguridad.Messenger.shared.exception;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta de error estándar")
public record ErrorResponse(
        @Schema(description = "Código de error")      String codigo,
        @Schema(description = "Mensaje descriptivo")   String mensaje
) {}
