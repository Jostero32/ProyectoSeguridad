package com.seguridad.Messenger.websocket.crypto;

import com.seguridad.Messenger.shared.crypto.TransportCryptoEngine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class WsCryptoService {

    public static final String VERSION = "ws-crypto-v1";

    private final TransportCryptoEngine cryptoEngine;

    public WsCryptoService(
            @Value("${messenger.ws.crypto.secret:dev-only-change-this-ws-crypto-secret}") String secret,
            @Value("${messenger.ws.crypto.algorithm:AES_GCM}") String algorithm) {
        this.cryptoEngine = new TransportCryptoEngine(secret, algorithm);
    }

    public WsCryptoEnvelope encryptJson(String json) {
        TransportCryptoEngine.EncryptedPayload encrypted = cryptoEngine.encrypt(json);
        return new WsCryptoEnvelope(
                true,
                VERSION,
                encrypted.alg(),
                encrypted.keyId(),
                encrypted.iv(),
                encrypted.ciphertext()
        );
    }

    public String decryptJson(WsCryptoEnvelope envelope) {
        if (envelope == null || !envelope.encrypted()) {
            throw new IllegalArgumentException("Envelope WebSocket cifrado invalido");
        }
        if (!VERSION.equals(envelope.version())) {
            throw new IllegalArgumentException("Version WebSocket cifrada no soportada");
        }

        return cryptoEngine.decrypt(envelope.alg(), envelope.iv(), envelope.ciphertext());
    }
}
