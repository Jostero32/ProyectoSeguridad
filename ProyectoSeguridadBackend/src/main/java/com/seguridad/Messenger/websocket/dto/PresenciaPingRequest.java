package com.seguridad.Messenger.websocket.dto;

/**
 * Heartbeat de presencia enviado por el cliente.
 *
 * visible=true/null  -> usuario disponible para mostrar "en línea".
 * visible=false      -> ocultar presencia inmediatamente.
 */
public record PresenciaPingRequest(Boolean visible) {}

