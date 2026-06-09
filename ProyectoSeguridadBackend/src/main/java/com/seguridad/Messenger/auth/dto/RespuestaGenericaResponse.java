package com.seguridad.Messenger.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta genérica para flujos donde la enumeración de usuarios debe evitarse")
public record RespuestaGenericaResponse(

        @Schema(description = "Mensaje legible al cliente")
        String mensaje

) {}
