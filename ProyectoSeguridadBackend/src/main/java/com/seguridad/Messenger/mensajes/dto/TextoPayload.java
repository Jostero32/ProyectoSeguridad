package com.seguridad.Messenger.mensajes.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Payload para mensajes de texto")
public record TextoPayload(
        @Schema(description = "Contenido del mensaje. Null cuando el mensaje usa E2EE.")
        String contenido,

        @Schema(description = "Datos cifrados de extremo a extremo. Null para mensajes legacy sin cifrar.")
        CifradoPayload cifrado
) implements MensajePayload {}
