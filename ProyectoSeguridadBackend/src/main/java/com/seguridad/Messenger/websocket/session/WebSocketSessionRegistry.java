package com.seguridad.Messenger.websocket.session;

import com.seguridad.Messenger.shared.enums.PrivacidadUltimoVisto;
import com.seguridad.Messenger.conversacion.repository.ParticipanteRepository;
import com.seguridad.Messenger.usuario.model.PerfilUsuario;
import com.seguridad.Messenger.usuario.repository.PerfilUsuarioRepository;
import com.seguridad.Messenger.usuario.repository.UsuarioRepository;
import com.seguridad.Messenger.websocket.dto.PresenciaPayload;
import com.seguridad.Messenger.websocket.dto.WebSocketEvent;
import com.seguridad.Messenger.websocket.service.EscribiendoService;
import com.seguridad.Messenger.websocket.service.WebSocketBroadcastService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.AbstractSubProtocolEvent;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Registry of active WebSocket sessions and externally visible presence.
 *
 * A user may have multiple sessions at once. Presence is controlled by
 * explicit heartbeats from the client and expires after inactivity.
 */
@Slf4j
@Component
public class WebSocketSessionRegistry implements ApplicationListener<AbstractSubProtocolEvent> {

    private static final long PRESENCE_HEARTBEAT_TIMEOUT_MS = 90_000;

    private final WebSocketBroadcastService broadcastService;
    private final EscribiendoService escribiendoService;
    private final PerfilUsuarioRepository perfilUsuarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final ParticipanteRepository participanteRepository;

    // usuarioId -> active websocket sessionIds
    private final ConcurrentHashMap<String, Set<String>> sesionesActivas = new ConcurrentHashMap<>();

    // usuarioId -> latest presence heartbeat epoch millis
    private final ConcurrentHashMap<String, Long> ultimoHeartbeatMs = new ConcurrentHashMap<>();

    // usuarioIds currently exposed as "online" to others
    private final Set<String> usuariosConPresenciaActiva = ConcurrentHashMap.newKeySet();

    public WebSocketSessionRegistry(
            @Lazy WebSocketBroadcastService broadcastService,
            @Lazy EscribiendoService escribiendoService,
            PerfilUsuarioRepository perfilUsuarioRepository,
            UsuarioRepository usuarioRepository,
            ParticipanteRepository participanteRepository) {
        this.broadcastService = broadcastService;
        this.escribiendoService = escribiendoService;
        this.perfilUsuarioRepository = perfilUsuarioRepository;
        this.usuarioRepository = usuarioRepository;
        this.participanteRepository = participanteRepository;
    }

    @Override
    public void onApplicationEvent(AbstractSubProtocolEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        if (event instanceof SessionConnectedEvent) {
            String usuarioIdStr = getPrincipalName(accessor);
            String sessionId = accessor.getSessionId();
            if (usuarioIdStr == null || sessionId == null) {
                return;
            }

            sesionesActivas
                    .computeIfAbsent(usuarioIdStr, ignored -> ConcurrentHashMap.newKeySet())
                    .add(sessionId);

            ultimoHeartbeatMs.putIfAbsent(usuarioIdStr, System.currentTimeMillis());

            try {
                enviarSnapshotPresenciaAUsuario(UUID.fromString(usuarioIdStr));
            } catch (Exception e) {
                log.warn("Error enviando snapshot de presencia usuario={}: {}", usuarioIdStr, e.getMessage());
            }
            return;
        }

        if (!(event instanceof SessionDisconnectEvent)) {
            return;
        }

        String usuarioIdStr = getPrincipalName(accessor);
        String sessionId = accessor.getSessionId();
        if (usuarioIdStr == null) {
            return;
        }

        Set<String> sesiones = sesionesActivas.get(usuarioIdStr);
        if (sesiones == null) {
            return;
        }

        sesiones.remove(sessionId);
        if (!sesiones.isEmpty()) {
            return;
        }

        sesionesActivas.remove(usuarioIdStr);
        ultimoHeartbeatMs.remove(usuarioIdStr);

        UUID usuarioId = UUID.fromString(usuarioIdStr);

        escribiendoService.limpiarTodosLosTimeouts(usuarioId);

        LocalDateTime ahora = LocalDateTime.now();

        if (usuariosConPresenciaActiva.remove(usuarioIdStr)) {
            emitirPresenciaOfflineForzada(usuarioId, ahora);
        }

        CompletableFuture.runAsync(() -> {
            try {
                perfilUsuarioRepository.actualizarUltimoVisto(usuarioId, ahora);
            } catch (Exception e) {
                log.warn("Error actualizando ultimoVisto usuario={}: {}", usuarioId, e.getMessage());
            }
        });
    }

    /**
     * Used by websocket broadcasting for message and typing events.
     */
    public boolean estaConectado(UUID usuarioId) {
        Set<String> sesiones = sesionesActivas.get(usuarioId.toString());
        return sesiones != null && !sesiones.isEmpty();
    }

    public Set<String> getUsuariosConectados() {
        return Collections.unmodifiableSet(sesionesActivas.keySet());
    }

    /**
     * Presence heartbeat from client.
     */
    public void registrarHeartbeat(UUID usuarioId) {
        String usuarioIdStr = usuarioId.toString();

        if (!sesionesActivas.containsKey(usuarioIdStr)) {
            return;
        }

        ultimoHeartbeatMs.put(usuarioIdStr, System.currentTimeMillis());

        if (!puedeCompartirPresencia(usuarioId)) {
            ocultarPresencia(usuarioId);
            return;
        }

        usuariosConPresenciaActiva.add(usuarioIdStr);
        emitirPresenciaOnline(usuarioId);
    }

    /**
     * Hides the user online status immediately.
     */
    public void ocultarPresencia(UUID usuarioId) {
        String usuarioIdStr = usuarioId.toString();
        if (!usuariosConPresenciaActiva.remove(usuarioIdStr)) {
            return;
        }

        LocalDateTime ahora = LocalDateTime.now();
        emitirPresenciaOfflineForzada(usuarioId, ahora);

        CompletableFuture.runAsync(() -> {
            try {
                perfilUsuarioRepository.actualizarUltimoVisto(usuarioId, ahora);
            } catch (Exception e) {
                log.warn("Error actualizando ultimoVisto al ocultar presencia usuario={}: {}", usuarioId, e.getMessage());
            }
        });
    }

    @Scheduled(fixedDelay = 20_000)
    public void depurarPresenciaInactiva() {
        long ahoraMs = System.currentTimeMillis();

        for (String usuarioIdStr : new HashSet<>(usuariosConPresenciaActiva)) {
            Long ultimoHeartbeat = ultimoHeartbeatMs.get(usuarioIdStr);
            if (ultimoHeartbeat != null && ahoraMs - ultimoHeartbeat <= PRESENCE_HEARTBEAT_TIMEOUT_MS) {
                continue;
            }

            if (!usuariosConPresenciaActiva.remove(usuarioIdStr)) {
                continue;
            }

            UUID usuarioId = UUID.fromString(usuarioIdStr);
            LocalDateTime ahora = LocalDateTime.now();

            emitirPresenciaOfflineForzada(usuarioId, ahora);

            CompletableFuture.runAsync(() -> {
                try {
                    perfilUsuarioRepository.actualizarUltimoVisto(usuarioId, ahora);
                } catch (Exception e) {
                    log.warn("Error actualizando ultimoVisto por timeout usuario={}: {}", usuarioId, e.getMessage());
                }
            });
        }
    }

    private boolean puedeCompartirPresencia(UUID usuarioId) {
        return perfilUsuarioRepository.findById(usuarioId)
                .map(PerfilUsuario::getPrivacidadUltimoVisto)
                .orElse(PrivacidadUltimoVisto.TODOS) != PrivacidadUltimoVisto.NADIE;
    }

    private void enviarSnapshotPresenciaAUsuario(UUID destinoUsuarioId) {
        List<UUID> contactos = participanteRepository.findUsuariosConConversacionIndividual(destinoUsuarioId);
        for (UUID usuarioOnlineId : contactos) {
            if (!usuariosConPresenciaActiva.contains(usuarioOnlineId.toString())) {
                continue;
            }

            String username = usuarioRepository.findUsernameById(usuarioOnlineId);
            if (username == null) {
                continue;
            }

            PresenciaPayload payload = new PresenciaPayload(usuarioOnlineId, username, true, null);
            broadcastService.enviarAUsuario(
                    destinoUsuarioId,
                    new WebSocketEvent<>("PRESENCIA", payload)
            );
        }
    }

    private void emitirPresenciaOnline(UUID usuarioId) {
        try {
            String username = usuarioRepository.findUsernameById(usuarioId);
            if (username == null) {
                return;
            }

            PresenciaPayload payload = new PresenciaPayload(usuarioId, username, true, null);
            WebSocketEvent<PresenciaPayload> evento = new WebSocketEvent<>("PRESENCIA", payload);

            Set<UUID> destinatarios = obtenerContactosConectados(usuarioId);
            destinatarios.forEach(uid -> broadcastService.enviarAUsuario(uid, evento));
            log.debug("PRESENCIA online usuario={} destinatarios={}", usuarioId, destinatarios.size());
        } catch (Exception e) {
            log.warn("Error emitiendo presencia online usuario={}: {}", usuarioId, e.getMessage());
        }
    }

    private void emitirPresenciaOfflineForzada(UUID usuarioId, LocalDateTime ultimoVisto) {
        try {
            String username = usuarioRepository.findUsernameById(usuarioId);
            if (username == null) {
                return;
            }

            PresenciaPayload payload = new PresenciaPayload(usuarioId, username, false, ultimoVisto);
            WebSocketEvent<PresenciaPayload> evento = new WebSocketEvent<>("PRESENCIA", payload);

            Set<UUID> destinatarios = obtenerContactosConectados(usuarioId);
            destinatarios.forEach(uid -> broadcastService.enviarAUsuario(uid, evento));
            log.debug("PRESENCIA offline usuario={} destinatarios={}", usuarioId, destinatarios.size());
        } catch (Exception e) {
            log.warn("Error emitiendo presencia offline usuario={}: {}", usuarioId, e.getMessage());
        }
    }

    private Set<UUID> obtenerContactosConectados(UUID usuarioId) {
        return participanteRepository.findUsuariosConConversacionIndividual(usuarioId).stream()
                .filter(contactoId -> !contactoId.equals(usuarioId))
                .filter(this::estaConectado)
                .collect(Collectors.toSet());
    }

    private String getPrincipalName(StompHeaderAccessor accessor) {
        return accessor.getUser() != null ? accessor.getUser().getName() : null;
    }
}
