package com.seguridad.Messenger.shared.crypto;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiCryptoRequestFilter extends OncePerRequestFilter {

    private final ApiCryptoService apiCryptoService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        if (!shouldDecrypt(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String encryptedBody = StreamUtils.copyToString(request.getInputStream(), StandardCharsets.UTF_8);
        if (encryptedBody.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            ApiCryptoEnvelope envelope = objectMapper.readValue(encryptedBody, ApiCryptoEnvelope.class);
            String decryptedJson = apiCryptoService.decryptJson(envelope);
            filterChain.doFilter(new CachedBodyHttpServletRequest(request, decryptedJson), response);
        } catch (IllegalArgumentException ex) {
            log.warn("[ApiCrypto] Descifrado fallido en {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ApiCryptoEnvelope error = apiCryptoService.encryptJson("""
                    {"error":"API_CRYPTO_ERROR","message":"Payload API cifrado invalido"}
                    """.trim());
            response.getWriter().write(objectMapper.writeValueAsString(error));
        }
    }

    private boolean shouldDecrypt(HttpServletRequest request) {
        if (!ApiCryptoService.VERSION.equals(request.getHeader(ApiCryptoService.HEADER))) {
            return false;
        }

        if (!hasBody(request.getMethod())) {
            return false;
        }

        String contentType = request.getContentType();
        return contentType != null
                && contentType.toLowerCase(Locale.ROOT).startsWith(MediaType.APPLICATION_JSON_VALUE);
    }

    private boolean hasBody(String method) {
        return "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method);
    }
}
