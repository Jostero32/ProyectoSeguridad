package com.seguridad.Messenger.websocket.crypto;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class WsCryptoInboundInterceptor implements ChannelInterceptor {

    private final WsCryptoService wsCryptoService;
    private final ObjectMapper objectMapper;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.SEND.equals(accessor.getCommand())) {
            return message;
        }

        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith("/app/")) {
            return message;
        }

        try {
            String encryptedBody = payloadToString(message.getPayload());
            WsCryptoEnvelope envelope = objectMapper.readValue(encryptedBody, WsCryptoEnvelope.class);
            String decryptedJson = wsCryptoService.decryptJson(envelope);

            return MessageBuilder
                    .withPayload(decryptedJson.getBytes(StandardCharsets.UTF_8))
                    .copyHeaders(message.getHeaders())
                    .build();
        } catch (Exception e) {
            throw new MessagingException("Frame STOMP cifrado invalido", e);
        }
    }

    private String payloadToString(Object payload) {
        if (payload instanceof byte[] bytes) {
            return new String(bytes, StandardCharsets.UTF_8);
        }

        return String.valueOf(payload);
    }
}
