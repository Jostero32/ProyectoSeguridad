package com.seguridad.Messenger.websocket.crypto;

public record WsCryptoEnvelope(
        boolean encrypted,
        String version,
        String alg,
        String keyId,
        String iv,
        String ciphertext
) {}
