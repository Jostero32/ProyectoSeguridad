package com.seguridad.Messenger.shared.crypto;

import javax.crypto.Cipher;
import javax.crypto.spec.ChaCha20ParameterSpec;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

public class TransportCryptoEngine {

    private static final int GCM_TAG_BITS = 128;

    private final SecureRandom secureRandom = new SecureRandom();
    private final TransportCryptoAlgorithm defaultAlgorithm;
    private final byte[] masterKey;
    private final String keyId;

    public TransportCryptoEngine(String secret, String algorithm) {
        this.defaultAlgorithm = parseAlgorithmOrDefault(algorithm);
        this.masterKey = sha256(secret);
        this.keyId = base64Url(firstBytes(this.masterKey, 9));
    }

    public EncryptedPayload encrypt(String plainText) {
        try {
            byte[] iv = randomIv(defaultAlgorithm);
            byte[] encrypted = switch (defaultAlgorithm) {
                case AES_GCM -> runAesGcm(Cipher.ENCRYPT_MODE, plainText.getBytes(StandardCharsets.UTF_8), iv);
                case DES_CBC -> runDesCbc(Cipher.ENCRYPT_MODE, plainText.getBytes(StandardCharsets.UTF_8), iv);
                case CHACHA20 -> runChaCha20(Cipher.ENCRYPT_MODE, plainText.getBytes(StandardCharsets.UTF_8), iv);
            };

            return new EncryptedPayload(
                    defaultAlgorithm.name(),
                    keyId,
                    Base64.getEncoder().encodeToString(iv),
                    Base64.getEncoder().encodeToString(encrypted)
            );
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo cifrar payload de transporte", e);
        }
    }

    public String decrypt(String algorithm, String ivBase64, String ciphertextBase64) {
        try {
            TransportCryptoAlgorithm selectedAlgorithm = parseAlgorithmStrict(algorithm);
            byte[] iv = Base64.getDecoder().decode(ivBase64);
            byte[] ciphertext = Base64.getDecoder().decode(ciphertextBase64);

            byte[] plain = switch (selectedAlgorithm) {
                case AES_GCM -> runAesGcm(Cipher.DECRYPT_MODE, ciphertext, iv);
                case DES_CBC -> runDesCbc(Cipher.DECRYPT_MODE, ciphertext, iv);
                case CHACHA20 -> runChaCha20(Cipher.DECRYPT_MODE, ciphertext, iv);
            };

            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalArgumentException("No se pudo descifrar payload de transporte", e);
        }
    }

    private byte[] runAesGcm(int mode, byte[] input, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(mode, new SecretKeySpec(masterKey, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
        return cipher.doFinal(input);
    }

    private byte[] runDesCbc(int mode, byte[] input, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("DES/CBC/PKCS5Padding");
        cipher.init(mode, new SecretKeySpec(firstBytes(masterKey, 8), "DES"), new IvParameterSpec(iv));
        return cipher.doFinal(input);
    }

    private byte[] runChaCha20(int mode, byte[] input, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("ChaCha20");
        cipher.init(mode, new SecretKeySpec(masterKey, "ChaCha20"), new ChaCha20ParameterSpec(iv, 1));
        return cipher.doFinal(input);
    }

    private byte[] randomIv(TransportCryptoAlgorithm algorithm) {
        byte[] iv = new byte[algorithm == TransportCryptoAlgorithm.DES_CBC ? 8 : 12];
        secureRandom.nextBytes(iv);
        return iv;
    }

    private TransportCryptoAlgorithm parseAlgorithmOrDefault(String value) {
        try {
            return parseAlgorithmStrict(value);
        } catch (Exception e) {
            return TransportCryptoAlgorithm.AES_GCM;
        }
    }

    private TransportCryptoAlgorithm parseAlgorithmStrict(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Algoritmo de transporte vacio");
        }

        String normalized = value.trim().toUpperCase();
        return switch (normalized) {
            case "AES", "AES_GCM" -> TransportCryptoAlgorithm.AES_GCM;
            case "DES", "DES_CBC" -> TransportCryptoAlgorithm.DES_CBC;
            case "CHACHA20", "CHACHA20_POLY1305" -> TransportCryptoAlgorithm.CHACHA20;
            default -> throw new IllegalArgumentException("Algoritmo de transporte no soportado: " + value);
        };
    }

    private byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    private byte[] firstBytes(byte[] input, int length) {
        byte[] output = new byte[length];
        System.arraycopy(input, 0, output, 0, output.length);
        return output;
    }

    private String base64Url(byte[] input) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(input);
    }

    public record EncryptedPayload(
            String alg,
            String keyId,
            String iv,
            String ciphertext
    ) {}
}
