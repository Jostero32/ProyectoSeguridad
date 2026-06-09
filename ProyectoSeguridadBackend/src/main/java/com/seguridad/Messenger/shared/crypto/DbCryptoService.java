package com.seguridad.Messenger.shared.crypto;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Service
public class DbCryptoService {

    private static final String PREFIX = "dbv1";
    private static final int GCM_TAG_BITS = 128;

    private final SecureRandom secureRandom = new SecureRandom();
    private final DbCryptoAlgorithm algorithm;
    private final byte[] masterKey;

    public DbCryptoService(
            @Value("${messenger.db.crypto.algorithm:AES_GCM}") String algorithm,
            @Value("${messenger.db.crypto.secret:dev-only-change-this-db-crypto-secret}") String secret) {
        this.algorithm = parseAlgorithm(algorithm);
        this.masterKey = sha256(secret);
    }

    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return plainText;
        }

        if (plainText.startsWith(PREFIX + ":")) {
            return plainText;
        }

        try {
            byte[] iv = randomIv(algorithm);
            byte[] encrypted = switch (algorithm) {
                case AES_GCM -> runAesGcm(Cipher.ENCRYPT_MODE, plainText.getBytes(StandardCharsets.UTF_8), iv);
                case DES_CBC -> runDesCbc(Cipher.ENCRYPT_MODE, plainText.getBytes(StandardCharsets.UTF_8), iv);
                case CHACHA20_POLY1305 ->
                        runChaCha20Poly1305(Cipher.ENCRYPT_MODE, plainText.getBytes(StandardCharsets.UTF_8), iv);
            };

            return String.join(":",
                    PREFIX,
                    algorithm.name(),
                    Base64.getEncoder().encodeToString(iv),
                    Base64.getEncoder().encodeToString(encrypted));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo cifrar dato de base", e);
        }
    }

    public String decrypt(String storedValue) {
        if (storedValue == null || storedValue.isBlank() || !storedValue.startsWith(PREFIX + ":")) {
            return storedValue;
        }

        String[] parts = storedValue.split(":", 4);
        if (parts.length != 4) {
            log.warn("Dato cifrado con formato invalido");
            return storedValue;
        }

        try {
            DbCryptoAlgorithm storedAlgorithm = parseAlgorithm(parts[1]);
            byte[] iv = Base64.getDecoder().decode(parts[2]);
            byte[] ciphertext = Base64.getDecoder().decode(parts[3]);

            byte[] plain = switch (storedAlgorithm) {
                case AES_GCM -> runAesGcm(Cipher.DECRYPT_MODE, ciphertext, iv);
                case DES_CBC -> runDesCbc(Cipher.DECRYPT_MODE, ciphertext, iv);
                case CHACHA20_POLY1305 -> runChaCha20Poly1305(Cipher.DECRYPT_MODE, ciphertext, iv);
            };

            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo descifrar dato de base", e);
        }
    }

    private byte[] runAesGcm(int mode, byte[] input, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(mode, new SecretKeySpec(masterKey, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
        return cipher.doFinal(input);
    }

    private byte[] runDesCbc(int mode, byte[] input, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("DES/CBC/PKCS5Padding");
        byte[] desKey = new byte[8];
        System.arraycopy(masterKey, 0, desKey, 0, desKey.length);
        cipher.init(mode, new SecretKeySpec(desKey, "DES"), new IvParameterSpec(iv));
        return cipher.doFinal(input);
    }

    private byte[] runChaCha20Poly1305(int mode, byte[] input, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("ChaCha20-Poly1305");
        cipher.init(mode, new SecretKeySpec(masterKey, "ChaCha20"), new IvParameterSpec(iv));
        return cipher.doFinal(input);
    }

    private byte[] randomIv(DbCryptoAlgorithm algorithm) {
        byte[] iv = new byte[algorithm == DbCryptoAlgorithm.DES_CBC ? 8 : 12];
        secureRandom.nextBytes(iv);
        return iv;
    }

    private DbCryptoAlgorithm parseAlgorithm(String value) {
        try {
            return DbCryptoAlgorithm.valueOf(value.trim().toUpperCase());
        } catch (Exception e) {
            return DbCryptoAlgorithm.AES_GCM;
        }
    }

    private byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
