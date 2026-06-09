package com.seguridad.Messenger.mensajes.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Payload cifrado de extremo a extremo")
public record CifradoPayload(
        @Schema(description = "Algoritmo usado por el cliente", example = "AES_GCM")
        String alg,

        @Schema(description = "Identificador de clave o contexto de derivacion")
        String keyId,

        @Schema(description = "Vector de inicializacion/nonces en base64")
        String iv,

        @Schema(description = "Texto cifrado en base64")
        String ciphertext
) {}
