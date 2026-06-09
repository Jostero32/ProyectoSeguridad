package com.seguridad.Messenger.shared.crypto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class ApiCryptoService {

    public static final String HEADER  = "X-Api-Crypto";
    // base64("api-crypto-v1") — obfuscates the version string on the wire
    public static final String VERSION = "YXBpLWNyeXB0by12MQ==";

    private final TransportCryptoEngine cryptoEngine;

    public ApiCryptoService(
            @Value("${messenger.api.crypto.secret:Secr3t8!}") String secret,
            @Value("${messenger.api.crypto.algorithm:DES_CBC}") String algorithm) {
        this.cryptoEngine = new TransportCryptoEngine(secret, algorithm);
    }

    public ApiCryptoEnvelope encryptJson(String json) {
        TransportCryptoEngine.EncryptedPayload encrypted = cryptoEngine.encrypt(json);
        return new ApiCryptoEnvelope(
                true,
                VERSION,
                b64Encode(encrypted.alg()),   // encode algorithm name to base64
                encrypted.keyId(),
                encrypted.iv(),
                encrypted.ciphertext()
        );
    }

    public String decryptJson(ApiCryptoEnvelope envelope) {
        if (envelope == null || !envelope.encrypted()) {
            throw new IllegalArgumentException("Envelope API cifrado invalido");
        }
        if (!VERSION.equals(envelope.version())) {
            throw new IllegalArgumentException("Version API cifrada no soportada");
        }

        String alg = b64Decode(envelope.alg());   // decode algorithm name from base64
        return cryptoEngine.decrypt(alg, envelope.iv(), envelope.ciphertext());
    }

    private static String b64Encode(String value) {
        return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String b64Decode(String value) {
        return new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
    }
}
