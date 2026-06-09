package com.seguridad.Messenger.shared.crypto;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@ControllerAdvice
@RequiredArgsConstructor
public class ApiCryptoResponseAdvice implements ResponseBodyAdvice<Object> {

    private final ApiCryptoService apiCryptoService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(
            Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response) {
        if (!shouldEncrypt(request, body, selectedContentType)) {
            return body;
        }

        try {
            String json = objectMapper.writeValueAsString(body);
            response.getHeaders().set(ApiCryptoService.HEADER, ApiCryptoService.VERSION);
            response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
            return apiCryptoService.encryptJson(json);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo cifrar respuesta API", e);
        }
    }

    private boolean shouldEncrypt(ServerHttpRequest request, Object body, MediaType selectedContentType) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }

        HttpServletRequest httpRequest = servletRequest.getServletRequest();
        if (!ApiCryptoService.VERSION.equals(httpRequest.getHeader(ApiCryptoService.HEADER))) {
            return false;
        }

        if (body == null || body instanceof ApiCryptoEnvelope) {
            return false;
        }

        if (selectedContentType == null) {
            return true;
        }

        return MediaType.APPLICATION_JSON.includes(selectedContentType)
                || selectedContentType.includes(MediaType.APPLICATION_JSON);
    }
}
