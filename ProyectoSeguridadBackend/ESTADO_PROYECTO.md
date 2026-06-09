# Estado del Proyecto — Messenger Backend

> Generado el 2026-04-28. Auditoría de solo lectura — ningún archivo fue modificado.

---

## 1. Estructura de paquetes

```
src/main/java/com/seguridad/Messenger/
├── MessengerApplication.java
│
├── auth/
│   ├── controller/
│   │   └── AuthController.java
│   ├── dto/
│   │   ├── LoginRequest.java
│   │   ├── LoginResponse.java
│   │   └── SesionResponse.java
│   ├── model/
│   │   └── DispositivoSesion.java
│   ├── repository/
│   │   └── DispositivoSesionRepository.java
│   └── security/
│       ├── TokenAuthFilter.java
│       └── TokenAuthProvider.java
│
├── config/
│   ├── AsyncConfig.java
│   ├── SecurityConfig.java
│   ├── StorageConfig.java
│   ├── StorageProperties.java
│   ├── SwaggerConfig.java
│   └── WebSocketConfig.java
│
├── conversacion/
│   ├── controller/
│   │   ├── ConversacionController.java
│   │   └── MiembroController.java
│   ├── dto/
│   │   ├── ActualizarConfiguracionRequest.java
│   │   ├── AgregarMiembrosRequest.java
│   │   ├── ChatIndividualResult.java
│   │   ├── ChatResumenResponse.java
│   │   ├── ConfiguracionChatResponse.java
│   │   ├── ConversacionResponse.java
│   │   ├── CrearChatIndividualRequest.java
│   │   ├── ParticipanteResponse.java
│   │   └── UltimoMensajeResponse.java
│   ├── model/
│   │   ├── ConfiguracionChat.java
│   │   ├── ConfiguracionChatId.java
│   │   ├── Conversacion.java
│   │   ├── Participante.java
│   │   └── ParticipanteId.java
│   ├── repository/
│   │   ├── ConfiguracionChatRepository.java
│   │   ├── ConversacionRepository.java
│   │   └── ParticipanteRepository.java
│   └── service/
│       └── ConversacionService.java
│
├── mensajes/
│   ├── controller/
│   │   └── MensajeController.java
│   ├── dto/
│   │   ├── ArchivoMultimediaResponse.java
│   │   ├── EditarMensajeRequest.java
│   │   ├── EnviarMensajeRequest.java         ← definido pero no usado por el controller
│   │   ├── EstadoMensajeResponse.java
│   │   ├── MensajeResponse.java
│   │   ├── ReaccionRequest.java
│   │   ├── ReaccionResponse.java
│   │   ├── RepliedMessageResponse.java
│   │   ├── ResumenReaccionesResponse.java
│   │   └── UbicacionResponse.java
│   ├── model/
│   │   ├── ArchivoMultimedia.java
│   │   ├── EstadoMensaje.java
│   │   ├── EstadoMensajeId.java
│   │   ├── Mensaje.java
│   │   ├── Reaccion.java
│   │   ├── ReaccionId.java
│   │   └── UbicacionMensaje.java
│   ├── repository/
│   │   ├── ArchivoMultimediaRepository.java
│   │   ├── EstadoMensajeRepository.java
│   │   ├── MensajeRepository.java
│   │   └── ReaccionRepository.java
│   └── service/
│       └── MensajeService.java
│
├── shared/
│   ├── controller/
│   │   └── ArchivoController.java
│   ├── enums/
│   │   ├── PrivacidadUltimoVisto.java
│   │   ├── RolParticipante.java
│   │   ├── TipoConversacion.java
│   │   └── TipoMensaje.java
│   ├── exception/
│   │   ├── AccesoDenegadoException.java
│   │   ├── ArchivoDemasiadoGrandeException.java
│   │   ├── ErrorResponse.java
│   │   ├── GlobalExceptionHandler.java
│   │   ├── RecursoNoEncontradoException.java
│   │   └── TipoArchivoNoPermitidoException.java
│   ├── security/
│   │   └── UserPrincipal.java
│   ├── service/
│   │   └── StorageService.java
│   └── util/
│       └── TokenGenerator.java
│
├── usuario/
│   ├── controller/
│   │   ├── BloqueoController.java
│   │   └── UsuarioController.java
│   ├── dto/
│   │   ├── BloqueoResponse.java
│   │   ├── PerfilResponse.java
│   │   └── RegistroRequest.java
│   ├── model/
│   │   ├── Bloqueo.java
│   │   ├── BloqueoId.java
│   │   ├── Persona.java
│   │   ├── PerfilUsuario.java
│   │   └── Usuario.java
│   ├── repository/
│   │   ├── BloqueoRepository.java
│   │   ├── PerfilUsuarioRepository.java
│   │   └── UsuarioRepository.java
│   └── service/
│       ├── BloqueoService.java
│       └── UsuarioService.java
│
└── websocket/
    ├── config/
    │   └── WebSocketAuthInterceptor.java
    ├── controller/
    │   └── PresenciaController.java
    ├── dto/
    │   ├── EscribiendoPayload.java
    │   ├── EscribiendoRequest.java
    │   ├── EstadoEntregaEventPayload.java
    │   ├── PresenciaPayload.java
    │   ├── ReaccionEventPayload.java
    │   └── WebSocketEvent.java
    ├── event/
    │   ├── EstadoEntregaEvent.java
    │   ├── MensajeEnviadoEvent.java
    │   └── ReaccionEvent.java
    ├── service/
    │   ├── EscribiendoService.java
    │   └── WebSocketBroadcastService.java
    └── session/
        └── WebSocketSessionRegistry.java
```

**Total de archivos `.java`:** 96

---

## 2. Dependencias (pom.xml)

**Spring Boot versión:** `4.0.4`  
**Java versión:** `21`  
**GroupId del proyecto:** `com.seguridad`  
**ArtifactId:** `Messenger`

| groupId | artifactId | version | scope | nota |
|---|---|---|---|---|
| org.springframework.boot | spring-boot-starter-data-jpa | — | compile | gestionado por BOM |
| org.springframework.boot | spring-boot-starter-data-redis-reactive | — | compile | gestionado por BOM |
| org.springframework.boot | spring-boot-starter-security | — | compile | gestionado por BOM |
| org.springframework.boot | spring-boot-starter-validation | — | compile | gestionado por BOM |
| org.springframework.boot | spring-boot-starter-webmvc | — | compile | gestionado por BOM |
| org.springframework.boot | spring-boot-starter-websocket | — | compile | gestionado por BOM |
| org.postgresql | postgresql | — | runtime | gestionado por BOM |
| org.projectlombok | lombok | — | compile (optional) | gestionado por BOM |
| org.mapstruct | mapstruct | 1.5.5.Final | compile | versión explícita |
| org.mapstruct | mapstruct-processor | 1.5.5.Final | provided | versión explícita |
| io.minio | minio | 8.5.9 | compile | versión explícita |
| org.apache.tika | tika-core | 2.9.2 | compile | versión explícita |
| org.springdoc | springdoc-openapi-starter-webmvc-ui | 3.0.2 | compile | versión explícita |
| commons-codec | commons-codec | — | compile | gestionado por BOM |
| org.springframework.boot | spring-boot-starter-data-jpa-test | — | test | gestionado por BOM |
| org.springframework.boot | spring-boot-starter-data-redis-reactive-test | — | test | gestionado por BOM |
| org.springframework.boot | spring-boot-starter-security-test | — | test | gestionado por BOM |
| org.springframework.boot | spring-boot-starter-validation-test | — | test | gestionado por BOM |
| org.springframework.boot | spring-boot-starter-webmvc-test | — | test | gestionado por BOM |
| org.springframework.boot | spring-boot-starter-websocket-test | — | test | gestionado por BOM |

> **Nota:** `mapstruct-processor` está declarado como `provided` pero el `maven-compiler-plugin` solo declara `lombok` en `annotationProcessorPaths`. MapStruct no está configurado como annotation processor explícito en el plugin, lo que puede impedir que genere código en tiempo de compilación (ver sección 16).

> **Nota:** `spring-boot-starter-data-redis-reactive` está declarado pero no hay ningún repositorio ni configuración de Redis en el código fuente. No se usa.

---

## 3. Configuración (application.properties)

```properties
spring.application.name=Messenger

# Base de datos
spring.datasource.url=jdbc:postgresql://localhost:5432/messenger_db
spring.datasource.username=postgres
spring.datasource.password=***
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Swagger / OpenAPI
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.disable-swagger-default-url=true

# MinIO storage
storage.endpoint=http://localhost:9000
storage.access-key=***
storage.secret-key=***
storage.bucket=messenger-archivos
storage.public-url=http://localhost:9000

# Multipart upload limits
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=105MB
```

> Las credenciales de PostgreSQL (`postgres`/`***`) y MinIO (`minioadmin`/`***`) están hardcodeadas en el archivo de propiedades. No hay perfiles separados por entorno (`application-prod.properties`).

---

## 4. Schema de base de datos

### Entidad: `Usuario`
```
Tabla: usuario
Campos:
  - id (UUID) → id [PK, auto UUID]
  - persona (Persona) → persona_id (UUID) [FK → persona.id, unique, not null, cascade ALL]
  - username (String) → username (VARCHAR) [unique, not null]
  - email (String) → email (VARCHAR) [unique, not null]
  - passwordHash (String) → password_hash (VARCHAR) [not null]
  - creadoEn (LocalDateTime) → creado_en (TIMESTAMP) [not null, updatable=false]
  - activo (boolean) → activo (BOOLEAN) [not null, default=true]
  - perfil (PerfilUsuario) → [mapped by "usuario", cascade ALL]
Relaciones:
  - @OneToOne → Persona (cascade ALL, owning side)
  - @OneToOne → PerfilUsuario (mappedBy "usuario", cascade ALL)
Índices declarados: no (aparte del PK y constraints unique de username/email)
```

### Entidad: `Persona`
```
Tabla: persona
Campos:
  - id (UUID) → id [PK, auto UUID]
  - nombres (String) → nombres (VARCHAR) [not null]
  - apellidos (String) → apellidos (VARCHAR) [not null]
  - fechaNacimiento (LocalDate) → fecha_nacimiento (DATE) [nullable]
Relaciones: ninguna
Índices declarados: no
```

### Entidad: `PerfilUsuario`
```
Tabla: perfil_usuario
Campos:
  - id (UUID) → usuario_id [PK, mapsId de usuario.id]
  - usuario (Usuario) → usuario_id [FK → usuario.id, @MapsId]
  - avatarKey (String) → avatar_key (VARCHAR) [nullable]
  - bio (String) → bio (VARCHAR(160)) [nullable]
  - telefono (String) → telefono (VARCHAR) [unique, nullable]
  - ultimoVisto (LocalDateTime) → ultimo_visto (TIMESTAMP) [nullable]
  - privacidadUltimoVisto (PrivacidadUltimoVisto) → privacidad_ultimo_visto (VARCHAR) [not null, default=TODOS]
Relaciones:
  - @OneToOne → Usuario (owning side con @MapsId)
Índices declarados: no
```

### Entidad: `Bloqueo`
```
Tabla: bloqueo
Campos (clave compuesta @EmbeddedId BloqueoId):
  - usuarioId (UUID) → usuario_id [PK parcial, not null]
  - bloqueadoId (UUID) → bloqueado_id [PK parcial, not null]
  - fechaBloqueo (LocalDateTime) → fecha_bloqueo [not null]
Relaciones: ninguna (los UUIDs son bare, sin @ManyToOne)
Índices declarados: no (PK compuesto es el índice)
```

### Entidad: `DispositivoSesion`
```
Tabla: dispositivo_sesion
Campos:
  - id (UUID) → id [PK, auto UUID]
  - usuario (Usuario) → usuario_id [FK → usuario.id, not null]
  - tokenSesion (String) → token_sesion [not null, unique]
  - infoDispositivo (String) → info_dispositivo [nullable]
  - ultimoAcceso (LocalDateTime) → ultimo_acceso [not null]
  - tokenPush (String) → token_push [nullable]
  - plataformaPush (String) → plataforma_push [nullable]
Relaciones:
  - @ManyToOne → Usuario
Índices declarados: sí — @Index(name="idx_dispositivo_token", columnList="token_sesion", unique=true)
```

### Entidad: `Conversacion`
```
Tabla: conversacion
Campos:
  - id (UUID) → id [PK, auto UUID]
  - tipo (TipoConversacion) → tipo (VARCHAR, EnumType.STRING) [not null]
  - canalHash (String) → canal_hash (VARCHAR) [unique, nullable — solo para INDIVIDUAL]
  - tituloGrupo (String) → titulo_grupo [nullable — solo para GRUPO]
  - avatarGrupoKey (String) → avatar_grupo_key [nullable]
  - creadaEn (LocalDateTime) → creada_en [not null, updatable=false]
Relaciones:
  - @OneToMany → Participante (mappedBy "conversacion", fetch LAZY)
Índices declarados: no (unique constraint en canal_hash actúa como índice)
```

### Entidad: `Participante`
```
Tabla: participante
Campos (clave compuesta @EmbeddedId ParticipanteId):
  - conversacionId (UUID) → conversacion_id [PK parcial]
  - usuarioId (UUID) → usuario_id [PK parcial]
  - conversacion (Conversacion) → conversacion_id [FK @MapsId]
  - usuario (Usuario) → usuario_id [FK @MapsId]
  - rol (RolParticipante) → rol (VARCHAR, EnumType.STRING) [not null]
  - fechaUnion (LocalDateTime) → fecha_union [not null]
Relaciones:
  - @ManyToOne → Conversacion
  - @ManyToOne → Usuario
Índices declarados: no
```

### Entidad: `ConfiguracionChat`
```
Tabla: configuracion_chat
Campos (clave compuesta @EmbeddedId ConfiguracionChatId):
  - conversacionId (UUID) → conversacion_id [PK parcial]
  - usuarioId (UUID) → usuario_id [PK parcial]
  - conversacion (Conversacion) → conversacion_id [FK @MapsId]
  - usuario (Usuario) → usuario_id [FK @MapsId]
  - silenciadoHasta (LocalDateTime) → silenciado_hasta [nullable]
  - archivado (boolean) → archivado [not null, default=false]
Relaciones:
  - @ManyToOne → Conversacion
  - @ManyToOne → Usuario
Índices declarados: no
```

### Entidad: `Mensaje`
```
Tabla: mensaje
Campos:
  - id (UUID) → id [PK, auto UUID]
  - conversacion (Conversacion) → conversacion_id [FK, not null, fetch LAZY]
  - remitenteId (UUID) → remitente_id [not null — bare UUID, sin @ManyToOne]
  - respuestaMensaje (Mensaje) → respuesta_mensaje_id [FK self-referential, nullable, fetch LAZY]
  - tipo (TipoMensaje) → tipo (VARCHAR, EnumType.STRING) [not null]
  - contenidoCifrado (String) → contenido_cifrado [nullable — nombre sugiere cifrado, pero no hay impl de cifrado]
  - creadoEn (LocalDateTime) → creado_en [not null, updatable=false]
  - editadoEn (LocalDateTime) → editado_en [nullable]
  - eliminadoEn (LocalDateTime) → eliminado_en [nullable]
  - eliminadoParaTodos (boolean) → eliminado_para_todos [not null, default=false]
Relaciones:
  - @ManyToOne → Conversacion
  - @ManyToOne → Mensaje (self, respuesta)
  - @OneToOne → ArchivoMultimedia (mappedBy "mensaje", cascade ALL, orphanRemoval)
  - @OneToOne → UbicacionMensaje (mappedBy "mensaje", cascade ALL, orphanRemoval)
  - @OneToMany → Reaccion (mappedBy "mensaje", cascade ALL, orphanRemoval, @BatchSize(30))
Índices declarados: no
```

### Entidad: `EstadoMensaje`
```
Tabla: estado_mensaje
Campos (clave compuesta @EmbeddedId EstadoMensajeId):
  - mensajeId (UUID) → mensaje_id [PK parcial]
  - usuarioId (UUID) → usuario_id [PK parcial]
  - entregadoEn (LocalDateTime) → entregado_en [nullable]
  - leidoEn (LocalDateTime) → leido_en [nullable]
Relaciones: ninguna (bare UUIDs)
Índices declarados: no
```

### Entidad: `Reaccion`
```
Tabla: reaccion
Campos (clave compuesta @EmbeddedId ReaccionId):
  - mensajeId (UUID) → mensaje_id [PK parcial]
  - usuarioId (UUID) → usuario_id [PK parcial]
  - mensaje (Mensaje) → mensaje_id [FK @MapsId]
  - usuario (Usuario) → usuario_id [FK @MapsId]
  - emoji (String) → emoji [not null]
  - creadaEn (LocalDateTime) → creada_en [not null, updatable=false]
Relaciones:
  - @ManyToOne → Mensaje
  - @ManyToOne → Usuario
Índices declarados: no (PK compuesto actúa como unique constraint — explotado por la query ON CONFLICT)
```

### Entidad: `ArchivoMultimedia`
```
Tabla: archivo_multimedia
Campos:
  - mensajeId (UUID) → mensaje_id [PK, mapsId de mensaje.id]
  - mensaje (Mensaje) → mensaje_id [FK @MapsId, @OneToOne]
  - nombreOriginal (String) → nombre_original [not null]
  - objectKey (String) → object_key [not null, unique]
  - contentType (String) → content_type [not null]
  - tamanioBytes (long) → tamanio_bytes [not null]
  - duracionSegundos (Integer) → duracion_segundos [nullable]
  - anchoPx (Integer) → ancho_px [nullable]
  - altoPx (Integer) → alto_px [nullable]
Relaciones:
  - @OneToOne → Mensaje (owning side con @MapsId)
Índices declarados: no (unique en object_key)
```

### Entidad: `UbicacionMensaje`
```
Tabla: ubicacion_mensaje
Campos:
  - mensajeId (UUID) → mensaje_id [PK, mapsId de mensaje.id]
  - mensaje (Mensaje) → mensaje_id [FK @MapsId, @OneToOne]
  - latitud (BigDecimal) → latitud [not null, precision=10, scale=7]
  - longitud (BigDecimal) → longitud [not null, precision=10, scale=7]
  - nombreLugar (String) → nombre_lugar [nullable]
Relaciones:
  - @OneToOne → Mensaje (owning side con @MapsId)
Índices declarados: no
```

---

## 5. Enums

### `TipoMensaje`
Valores: `TEXTO`, `IMAGEN`, `AUDIO`, `VIDEO`, `DOCUMENTO`, `UBICACION`, `STICKER`, `GIF`  
Usado en: `Mensaje.tipo`, `UltimoMensajeResponse.tipo`, `MensajeResponse.tipo`, `StorageService` (validación MIME/tamaño), `MensajeController`, `MensajeService`, `ConversacionService.generarPreview()`

### `TipoConversacion`
Valores: `INDIVIDUAL`, `GRUPO`  
Usado en: `Conversacion.tipo`, `ConversacionResponse.tipo`, `ChatResumenResponse.tipo`, `ConversacionService`, `MiembroController`

### `RolParticipante`
Valores: `ADMIN`, `MIEMBRO`  
Usado en: `Participante.rol`, `ParticipanteResponse.rol`, `ConversacionService`, `ParticipanteRepository`

### `PrivacidadUltimoVisto`
Valores: `TODOS` (serializado como `"todos"`), `CONTACTOS` (`"contactos"`), `NADIE` (`"nadie"`)  
Anotaciones: `@JsonValue`/`@JsonCreator` para serialización custom; `@Converter(autoApply=true)` para JPA.  
Usado en: `PerfilUsuario.privacidadUltimoVisto`, `UsuarioController`, `UsuarioService`, `WebSocketSessionRegistry`

---

## 6. Endpoints REST

### Controller: `AuthController`
**Base:** `/auth`

| Método | Ruta | Auth | Request | Response | Llama a |
|---|---|---|---|---|---|
| POST | `/auth/login` | No | JSON `LoginRequest` (`email`, `password`) | `LoginResponse` (200) | `UsuarioRepository.findByEmail`, `PasswordEncoder.matches`, `TokenGenerator.generarToken`, `DispositivoSesionRepository.save` |
| POST | `/auth/logout` | Sí | Header `Authorization: Bearer {token}` | 204 | `DispositivoSesionRepository.eliminarPorToken` |
| POST | `/auth/logout-all` | Sí | `@AuthenticationPrincipal` | 204 | `DispositivoSesionRepository.eliminarPorUsuarioId` |
| GET | `/auth/sesiones` | Sí | — | `List<SesionResponse>` (200) | `DispositivoSesionRepository.findByUsuarioId` |

---

### Controller: `UsuarioController`
**Base:** `/usuarios`

| Método | Ruta | Auth | Request | Response | Llama a |
|---|---|---|---|---|---|
| POST | `/usuarios/registro` | No | JSON `RegistroRequest` | `PerfilResponse` (201) | `UsuarioService.registrar`, `UsuarioService.obtenerPerfilPropio` |
| GET | `/usuarios/me` | Sí | `@AuthenticationPrincipal` | `PerfilResponse` (200) | `UsuarioService.obtenerPerfilPropio` |
| PATCH | `/usuarios/me` | Sí | `multipart/form-data` (avatar, bio, privacidadUltimoVisto) | `PerfilResponse` (200) | `UsuarioService.actualizarPerfil` |
| GET | `/usuarios/{id}` | Sí | Path param `id` (UUID) | `PerfilResponse` (200) | `UsuarioService.obtenerPerfilPublico` |
| GET | `/usuarios/buscar` | Sí | Query `q`, `page` (def. 0), `size` (def. 20) | `Page<PerfilResponse>` (200) | `UsuarioService.buscar` |

---

### Controller: `BloqueoController`
**Base:** `/usuarios/me/bloqueos`  Auth: siempre requerida.

| Método | Ruta | Request | Response | Llama a |
|---|---|---|---|---|
| GET | `/usuarios/me/bloqueos` | — | `List<BloqueoResponse>` (200) | `BloqueoService.listar` |
| POST | `/usuarios/me/bloqueos/{bloqueadoId}` | Path param `bloqueadoId` | 204 | `BloqueoService.bloquear` |
| DELETE | `/usuarios/me/bloqueos/{bloqueadoId}` | Path param `bloqueadoId` | 204 | `BloqueoService.desbloquear` |
| GET | `/usuarios/me/bloqueos/{bloqueadoId}` | Path param `bloqueadoId` | `Boolean` (200) | `BloqueoService.esBloqueado` |

---

### Controller: `ConversacionController`
**Base:** `/chats`  Auth: siempre requerida.

| Método | Ruta | Request | Response | Llama a |
|---|---|---|---|---|
| POST | `/chats/individual` | JSON `CrearChatIndividualRequest` (`destinatarioId`) | `ConversacionResponse` (200 o 201) | `ConversacionService.crearChatIndividual` |
| POST | `/chats/grupo` | `multipart/form-data` (`titulo`, `avatar` opcional, `miembrosIds` JSON array) | `ConversacionResponse` (201) | `ConversacionService.crearGrupo` |
| GET | `/chats` | Query `incluirArchivadas` (def. false) | `List<ChatResumenResponse>` (200) | `ConversacionService.listarChats` |
| GET | `/chats/{id}` | Path param `id` | `ConversacionResponse` (200) | `ConversacionService.obtenerConversacion` |
| PATCH | `/chats/{id}` | `multipart/form-data` (`titulo` opcional, `avatar` opcional) | `ConversacionResponse` (200) | `ConversacionService.actualizarGrupo` |
| DELETE | `/chats/{id}` | Path param `id` | 204 | `ConversacionService.eliminarGrupo` |
| GET | `/chats/{id}/configuracion` | — | `ConfiguracionChatResponse` (200) | `ConversacionService.obtenerConfiguracion` |
| POST | `/chats/{id}/leido` | — | 204 | `MensajeService.marcarTodosLeidos` |
| PUT | `/chats/{id}/configuracion` | JSON `ActualizarConfiguracionRequest` (`silenciadoHasta`, `archivado`) | `ConfiguracionChatResponse` (200) | `ConversacionService.actualizarConfiguracion` |

---

### Controller: `MiembroController`
**Base:** `/chats/{conversacionId}/miembros`  Auth: siempre requerida.

| Método | Ruta | Request | Response | Llama a |
|---|---|---|---|---|
| GET | `/chats/{cid}/miembros` | — | `List<ParticipanteResponse>` (200) | `ConversacionService.listarMiembros` |
| POST | `/chats/{cid}/miembros` | JSON `AgregarMiembrosRequest` (`usuarioIds`) | `List<ParticipanteResponse>` (200) | `ConversacionService.agregarMiembros` |
| DELETE | `/chats/{cid}/miembros/{usuarioId}` | Path param `usuarioId` | 204 | `ConversacionService.expulsarMiembro` |
| DELETE | `/chats/{cid}/miembros/me` | — | 204 | `ConversacionService.abandonarGrupo` |

---

### Controller: `MensajeController`
**Base:** `/chats/{conversacionId}/mensajes`  Auth: siempre requerida.

| Método | Ruta | Request | Response | Llama a |
|---|---|---|---|---|
| GET | `/chats/{cid}/mensajes` | Query `page` (def. 0), `size` (def. 20, max 50) | `Page<MensajeResponse>` (200) | `MensajeService.historial` |
| POST | `/chats/{cid}/mensajes` | `multipart/form-data` (`tipo`, `contenido`, `archivo`, `respuestaMensajeId`, `latitud`, `longitud`, `nombreLugar`, `duracionSegundos`, `anchoPx`, `altoPx`) | `MensajeResponse` (201) | `MensajeService.enviarMensaje` |
| PATCH | `/chats/{cid}/mensajes/{mid}` | JSON `EditarMensajeRequest` (`contenido`) | `MensajeResponse` (200) | `MensajeService.editarMensaje` |
| DELETE | `/chats/{cid}/mensajes/{mid}` | Query `tipo` (def. `para_mi`) | 204 | `MensajeService.eliminarMensaje` |
| PUT | `/chats/{cid}/mensajes/{mid}/reaccion` | JSON `ReaccionRequest` (`emoji`) | `List<ResumenReaccionesResponse>` (200) | `MensajeService.reaccionar` |
| DELETE | `/chats/{cid}/mensajes/{mid}/reaccion` | — | 204 | `MensajeService.quitarReaccion` |
| GET | `/chats/{cid}/mensajes/{mid}/reacciones` | — | `List<ReaccionResponse>` (200) | `MensajeService.listarReacciones` |

---

### Controller: `ArchivoController`
**Base:** `/archivos`  Auth: requerida.

| Método | Ruta | Request | Response | Llama a |
|---|---|---|---|---|
| GET | `/archivos/**` | Path comodín `objectKey` extraído de la URL | Redirect 302 a presigned URL de MinIO | `StorageService.generarPresignedUrl` |

---

### Controller STOMP: `PresenciaController`
**Mensajes entrantes (cliente → servidor)**

| Destino STOMP | Payload | Llama a |
|---|---|---|
| `/app/escribiendo` | `EscribiendoRequest` (`conversacionId`) | `EscribiendoService.usuarioEscribiendo` |
| `/app/dejo-de-escribir` | `EscribiendoRequest` (`conversacionId`) | `EscribiendoService.usuarioDejoDeEscribir` |

---

## 7. Servicios

### `UsuarioService`
```
Servicio: UsuarioService
  Métodos públicos:
    - registrar(RegistroRequest) → Usuario
        @Transactional: sí
        Lógica: crea Persona, Usuario con password hasheado (BCrypt) y PerfilUsuario. Persiste todo en cascada.
        Repositorios: UsuarioRepository

    - obtenerPerfilPropio(UUID usuarioId) → PerfilResponse
        @Transactional: no
        Lógica: carga usuario activo, construye PerfilResponse con ultimo_visto siempre visible.
        Repositorios: UsuarioRepository

    - obtenerPerfilPublico(UUID id) → PerfilResponse
        @Transactional: no
        Lógica: igual que obtenerPerfilPropio pero oculta ultimo_visto si privacidad != TODOS.
        Repositorios: UsuarioRepository

    - actualizarPerfil(UUID, MultipartFile, String, String) → PerfilResponse
        @Transactional: sí
        Lógica: sube nuevo avatar (si provisto), actualiza bio y privacidadUltimoVisto, elimina avatar viejo de MinIO.
        Repositorios: UsuarioRepository
        Usa: StorageService

    - buscar(String query, int page, int size) → Page<PerfilResponse>
        @Transactional: no
        Lógica: búsqueda case-insensitive contains en username, nombres y apellidos.
        Repositorios: UsuarioRepository
```

### `BloqueoService`
```
Servicio: BloqueoService
  Métodos públicos:
    - listar(UUID usuarioId) → List<BloqueoResponse>
        @Transactional: no
        Lógica: devuelve todos los bloqueos del usuario con datos del bloqueado.
        Repositorios: BloqueoRepository, UsuarioRepository, PerfilUsuarioRepository

    - bloquear(UUID usuarioId, UUID bloqueadoId) → void
        @Transactional: sí
        Lógica: valida no-auto-bloqueo, verifica existencia del objetivo, idempotente si ya bloqueado.
        Repositorios: BloqueoRepository, UsuarioRepository

    - desbloquear(UUID usuarioId, UUID bloqueadoId) → void
        @Transactional: sí
        Lógica: elimina el bloqueo. Lanza RecursoNoEncontrado si no existe.
        Repositorios: BloqueoRepository

    - esBloqueado(UUID usuarioId, UUID bloqueadoId) → boolean
        @Transactional: no
        Lógica: simple existsById.
        Repositorios: BloqueoRepository
```

### `ConversacionService`
```
Servicio: ConversacionService
  @Transactional a nivel de clase (todos los métodos son transaccionales por defecto)

  Métodos públicos:
    - crearChatIndividual(UUID, CrearChatIndividualRequest) → ChatIndividualResult
        Lógica: valida no-auto-chat, verifica bloqueos bidireccionales, busca por canal_hash (SHA-256 de UUIDs
                ordenados), crea conversación+participantes si no existe.
        Repositorios: BloqueoRepository, ConversacionRepository, UsuarioRepository, ParticipanteRepository

    - crearGrupo(UUID, String, MultipartFile, List<UUID>) → ConversacionResponse
        Lógica: sube avatar si provisto, crea conversación GRUPO, creador=ADMIN, miembros=MIEMBRO.
        Repositorios: UsuarioRepository, ConversacionRepository, ParticipanteRepository
        Usa: StorageService

    - listarChats(UUID, boolean incluirArchivadas) → List<ChatResumenResponse>
        @Transactional(readOnly=true)
        Lógica: carga conversaciones con FETCH JOIN, filtra archivadas, construye resumen con último
                mensaje y conteo de no-leídos.
        Repositorios: ConversacionRepository, ConfiguracionChatRepository, MensajeRepository,
                      EstadoMensajeRepository, UsuarioRepository

    - obtenerConversacion(UUID, UUID) → ConversacionResponse
        @Transactional(readOnly=true)
        Lógica: verifica participante, carga conversación con detalles.
        Repositorios: ParticipanteRepository, ConversacionRepository

    - actualizarGrupo(UUID, UUID, String, MultipartFile) → ConversacionResponse
        Lógica: solo ADMIN puede actualizar. Sube nuevo avatar y elimina el anterior.
        Repositorios: ConversacionRepository, ParticipanteRepository
        Usa: StorageService

    - eliminarGrupo(UUID, UUID) → void
        Lógica: solo ADMIN puede eliminar. Hard delete en cascada.
        Repositorios: ConversacionRepository

    - listarMiembros(UUID, UUID) → List<ParticipanteResponse>
        @Transactional(readOnly=true)
        Repositorios: ParticipanteRepository

    - agregarMiembros(UUID, UUID adminId, AgregarMiembrosRequest) → List<ParticipanteResponse>
        Lógica: solo ADMIN. Idempotente (ignora ya-miembros). Agrega como MIEMBRO.
        Repositorios: ConversacionRepository, ParticipanteRepository, UsuarioRepository

    - expulsarMiembro(UUID, UUID adminId, UUID objetivoId) → void
        Lógica: solo ADMIN puede expulsar. No puede expulsar a otro ADMIN.
        Repositorios: ConversacionRepository, ParticipanteRepository

    - abandonarGrupo(UUID, UUID) → void
        Lógica: si es el último miembro, elimina el grupo. Si es el único ADMIN, promueve al miembro
                más antiguo. Luego elimina al participante.
        Repositorios: ConversacionRepository, ParticipanteRepository

    - obtenerConfiguracion(UUID, UUID) → ConfiguracionChatResponse
        @Transactional(readOnly=true)
        Lógica: devuelve config personalizada o defaults (false, null, false) si no existe.
        Repositorios: ParticipanteRepository, ConfiguracionChatRepository

    - actualizarConfiguracion(UUID, UUID, ActualizarConfiguracionRequest) → ConfiguracionChatResponse
        Lógica: upsert de ConfiguracionChat.
        Repositorios: ParticipanteRepository, ConversacionRepository, UsuarioRepository, ConfiguracionChatRepository
```

### `MensajeService`
```
Servicio: MensajeService
  @Transactional a nivel de clase

  Métodos públicos:
    - enviarMensaje(UUID cid, UUID uid, TipoMensaje, String, UUID, MultipartFile, Integer, Integer, Integer,
                   BigDecimal, BigDecimal, String) → MensajeResponse
        Lógica: verifica participante, valida campos requeridos por tipo, valida mensaje de respuesta,
                persiste Mensaje + ArchivoMultimedia o UbicacionMensaje, crea EstadoMensaje "entregado"
                para cada receptor, publica MensajeEnviadoEvent y EstadoEntregaEvent.
        Repositorios: ParticipanteRepository, MensajeRepository, ConversacionRepository,
                      EstadoMensajeRepository, ParticipanteRepository
        Usa: StorageService
        Eventos publicados: MensajeEnviadoEvent, EstadoEntregaEvent (uno por receptor)

    - editarMensaje(UUID, UUID, UUID, EditarMensajeRequest) → MensajeResponse
        Lógica: solo el autor puede editar. Solo mensajes TEXTO. No se pueden editar eliminados.
        Repositorios: ParticipanteRepository, MensajeRepository, EstadoMensajeRepository, ReaccionRepository

    - eliminarMensaje(UUID, UUID, UUID, String tipo) → void
        Lógica: "para_mi" → cualquier participante, "para_todos" → solo remitente (elimina archivo de MinIO).
        Repositorios: ParticipanteRepository, MensajeRepository
        Usa: StorageService

    - marcarTodosLeidos(UUID conversacionId, UUID usuarioId) → void
        Lógica: bulk update leido_en para mensajes pendientes, publica EstadoEntregaEvent por cada mensaje.
        Repositorios: ParticipanteRepository, EstadoMensajeRepository
        Eventos publicados: EstadoEntregaEvent (uno por mensaje)

    - historial(UUID, UUID, Pageable) → Page<MensajeResponse>
        @Transactional(readOnly=true)
        Lógica: historial paginado, excluye eliminados_para_todos, orden DESC por creado_en.
        Repositorios: ParticipanteRepository, MensajeRepository, EstadoMensajeRepository, ReaccionRepository

    - reaccionar(UUID, UUID, UUID, ReaccionRequest) → List<ResumenReaccionesResponse>
        Lógica: upsert de reacción (SQL nativo ON CONFLICT), publica ReaccionEvent.
        Repositorios: ParticipanteRepository, MensajeRepository, ReaccionRepository
        Eventos publicados: ReaccionEvent ("NUEVA_REACCION")

    - quitarReaccion(UUID, UUID, UUID) → void
        Lógica: elimina reacción, publica ReaccionEvent.
        Repositorios: ParticipanteRepository, MensajeRepository, ReaccionRepository
        Eventos publicados: ReaccionEvent ("REACCION_ELIMINADA")

    - listarReacciones(UUID, UUID, UUID) → List<ReaccionResponse>
        @Transactional(readOnly=true)
        Lógica: devuelve lista detallada ordenada por creada_en ASC.
        Repositorios: ParticipanteRepository, MensajeRepository, ReaccionRepository
```

### `StorageService`
```
Servicio: StorageService
  Métodos públicos:
    - subir(MultipartFile, TipoMensaje) → StorageResult
        Lógica: detecta MIME real con Apache Tika, valida contra whitelist por tipo, valida tamaño,
                sube a MinIO con object_key = "{tipo_lower}/{UUID}{extension}".

    - subirAvatar(MultipartFile) → String (objectKey)
        Lógica: valida MIME (jpeg/png/webp), valida tamaño (≤5MB), sube a MinIO
                con object_key = "avatars/{UUID}.{ext}".

    - generarPresignedUrl(String objectKey) → String
        Lógica: genera URL firmada válida por 1 día mediante MinIO SDK.

    - eliminar(String objectKey) → void
        Lógica: best-effort (log warn si falla, no propaga excepción).
```

### `EscribiendoService`
```
Servicio: EscribiendoService
  Métodos públicos:
    - usuarioEscribiendo(UUID conversacionId, UUID, String username) → void
        Lógica: cancela timer anterior (si existe), emite ESCRIBIENDO al topic, programa
                DEJO_DE_ESCRIBIR automático en 4 segundos.

    - usuarioDejoDeEscribir(UUID conversacionId, UUID, String) → void
        Lógica: cancela timer y emite DEJO_DE_ESCRIBIR de inmediato.

    - limpiarTodosLosTimeouts(UUID usuarioId) → void
        Lógica: cancela todos los timers activos del usuario (llamado en desconexión).
```

### `WebSocketBroadcastService`
```
Servicio: WebSocketBroadcastService
  Métodos/listeners:
    - onMensajeEnviado(MensajeEnviadoEvent) → void
        @TransactionalEventListener(AFTER_COMMIT)
        Lógica: broadcast a /topic/conversacion.{id} con tipo=NUEVO_MENSAJE

    - onReaccion(ReaccionEvent) → void
        @TransactionalEventListener(AFTER_COMMIT)
        Lógica: broadcast a /topic/conversacion.{id} con tipo=NUEVA_REACCION o REACCION_ELIMINADA

    - onEstadoEntrega(EstadoEntregaEvent) → void
        @TransactionalEventListener(AFTER_COMMIT)
        Lógica: si el remitente está conectado, envía a /user/{remitenteId}/queue/notificaciones

    - broadcastMensaje(MensajeResponse) → void
        Envío directo sin evento.

    - enviarAUsuario(UUID, WebSocketEvent) → void
        Envío a cola personal del usuario.
```

---

## 8. Repositorios

### `DispositivoSesionRepository` — entidad: `DispositivoSesion`
| Método | Tipo | Nota |
|---|---|---|
| `findByTokenSesion(String)` → `Optional<DispositivoSesion>` | derived query | |
| `findByUsuarioId(UUID)` → `List<DispositivoSesion>` | derived query | `usuario.id` navegado |
| `actualizarUltimoAcceso(String, LocalDateTime)` → `void` | @Modifying @Query JPQL + @Async | actualiza `ultimo_acceso` asíncronamente |
| `eliminarPorToken(String)` → `void` | @Modifying @Query JPQL | |
| `eliminarPorUsuarioId(UUID)` → `void` | @Modifying @Query JPQL | |

### `UsuarioRepository` — entidad: `Usuario`
| Método | Tipo |
|---|---|
| `findByEmail(String)` → `Optional<Usuario>` | derived query |
| `findByIdAndActivoTrue(UUID)` → `Optional<Usuario>` | derived query |
| `existsByEmail(String)` → `boolean` | derived query |
| `existsByUsername(String)` → `boolean` | derived query |
| `buscar(String q, Pageable)` → `Page<Usuario>` | @Query JPQL — JOIN FETCH persona, LIKE case-insensitive en username/nombres/apellidos |
| `findUsernameById(UUID)` → `String` | @Query JPQL — proyección parcial |

### `BloqueoRepository` — entidad: `Bloqueo`
| Método | Tipo |
|---|---|
| `findByIdUsuarioId(UUID)` → `List<Bloqueo>` | derived query |
| `existsByIdUsuarioIdAndIdBloqueadoId(UUID, UUID)` → `boolean` | derived query |

### `PerfilUsuarioRepository` — entidad: `PerfilUsuario`
| Método | Tipo |
|---|---|
| `actualizarUltimoVisto(UUID, LocalDateTime)` → `void` | @Modifying @Query JPQL |
| `findUrlAvatarById(UUID)` → `String` | @Query JPQL — proyección parcial |

### `ConversacionRepository` — entidad: `Conversacion`
| Método | Tipo |
|---|---|
| `findByCanalHash(String)` → `Optional<Conversacion>` | derived query |
| `findConversacionesConDetalles(UUID usuarioId)` → `List<Conversacion>` | @Query JPQL — DISTINCT + FETCH JOIN participantes/usuario/persona/perfil |
| `findByIdConDetalles(UUID)` → `Optional<Conversacion>` | @Query JPQL — FETCH JOIN participantes/usuario/persona/perfil |

### `ParticipanteRepository` — entidad: `Participante`
| Método | Tipo |
|---|---|
| `findByIdConversacionIdAndIdUsuarioId(UUID, UUID)` → `Optional<Participante>` | derived query |
| `existsByIdConversacionIdAndIdUsuarioId(UUID, UUID)` → `boolean` | derived query |
| `countByIdConversacionId(UUID)` → `long` | derived query |
| `countByIdConversacionIdAndRol(UUID, RolParticipante)` → `long` | derived query |
| `findByIdConversacionIdConUsuario(UUID)` → `List<Participante>` | @Query JPQL — JOIN FETCH usuario/persona/perfil |
| `findUsuarioIdsByConversacionExcluyendo(UUID, UUID)` → `List<UUID>` | @Query JPQL — proyección de IDs |
| `findMasAntiguoExcluyendo(UUID, UUID, Pageable)` → `List<Participante>` | @Query JPQL — ORDER BY fechaUnion ASC |
| `findUsuariosConConversacionIndividual(UUID)` → `List<UUID>` | @Query JPQL — self-join entre Participante y Conversacion tipo INDIVIDUAL |

### `ConfiguracionChatRepository` — entidad: `ConfiguracionChat`
| Método | Tipo |
|---|---|
| `findByIdConversacionIdAndIdUsuarioId(UUID, UUID)` → `Optional<ConfiguracionChat>` | derived query |
| `findByIdUsuarioIdAndArchivadoTrue(UUID)` → `List<ConfiguracionChat>` | derived query |

### `MensajeRepository` — entidad: `Mensaje`
| Método | Tipo |
|---|---|
| `findByConversacion(UUID, Pageable)` → `Page<Mensaje>` | @Query JPQL — excluye eliminados_para_todos, ORDER BY creadoEn DESC |
| `findTopByConversacionIdOrderByCreadoEnDesc(UUID)` → `Optional<Mensaje>` | derived query |
| `findRemitenteId(UUID)` → `UUID` | @Query JPQL — proyección parcial |

### `EstadoMensajeRepository` — entidad: `EstadoMensaje`
| Método | Tipo |
|---|---|
| `findByIdMensajeId(UUID)` → `List<EstadoMensaje>` | derived query |
| `findMensajeIdsPendientesDeLectura(UUID, UUID)` → `List<UUID>` | @Query JPQL — subquery con filtros |
| `marcarTodosLeidosPorConversacion(UUID, UUID, LocalDateTime)` → `int` | @Modifying @Query JPQL — bulk update |
| `countNoLeidos(UUID, UUID)` → `long` | @Query JPQL — COUNT con subquery |

### `ReaccionRepository` — entidad: `Reaccion`
| Método | Tipo |
|---|---|
| `upsert(UUID, UUID, String, LocalDateTime)` | @Modifying nativeQuery — PostgreSQL `ON CONFLICT DO UPDATE` |
| `findByMensajeId(UUID)` → `List<Reaccion>` | @Query JPQL |
| `findByMensajeIdConUsuario(UUID)` → `List<Reaccion>` | @Query JPQL — JOIN FETCH usuario, ORDER BY creadaEn ASC |
| `existsByIdMensajeIdAndIdUsuarioIdAndEmoji(UUID, UUID, String)` → `boolean` | @Query JPQL — definido pero **no invocado** en el código actual |

### `ArchivoMultimediaRepository` — entidad: `ArchivoMultimedia`
Sin queries personalizadas. Solo hereda los métodos de `JpaRepository<ArchivoMultimedia, UUID>`.

---

## 9. DTOs

### Auth

| DTO | Tipo | Campos | Validaciones | Usado en |
|---|---|---|---|---|
| `LoginRequest` | record | `email`, `password` | `@NotBlank @Email`, `@NotBlank @Size(min=8)` | `AuthController.login` |
| `LoginResponse` | record | `token`, `usuarioId` | — | `AuthController.login` |
| `SesionResponse` | record | `id`, `infoDispositivo`, `ultimoAcceso`, `plataformaPush` | — | `AuthController.listarSesiones` |

### Usuario

| DTO | Tipo | Campos | Validaciones | Usado en |
|---|---|---|---|---|
| `RegistroRequest` | record | `nombres`, `apellidos`, `fechaNacimiento`, `username`, `email`, `password` | `@NotBlank`, `@NotNull`, `@Email`, `@Size(min=8)` | `UsuarioController.registrar` |
| `PerfilResponse` | record | `id`, `username`, `nombres`, `apellidos`, `urlAvatar`, `bio`, `ultimoVisto`, `privacidadUltimoVisto` | — | `UsuarioController`, `UsuarioService` |
| `BloqueoResponse` | record | `usuarioId`, `username`, `nombreCompleto`, `urlAvatar`, `fechaBloqueo` | — | `BloqueoController`, `BloqueoService` |

### Conversacion

| DTO | Tipo | Campos | Validaciones | Usado en |
|---|---|---|---|---|
| `CrearChatIndividualRequest` | record | `destinatarioId` | `@NotNull` | `ConversacionController` |
| `AgregarMiembrosRequest` | record | `usuarioIds` | `@NotEmpty` | `MiembroController` |
| `ActualizarConfiguracionRequest` | record | `silenciadoHasta`, `archivado` | — | `ConversacionController` |
| `ConversacionResponse` | record | `id`, `tipo`, `titulo`, `urlAvatar`, `creadaEn`, `esAdmin`, `totalMiembros` | — | `ConversacionController`, `ConversacionService` |
| `ChatResumenResponse` | record | `id`, `tipo`, `titulo`, `urlAvatar`, `creadaEn`, `esAdmin`, `ultimoMensaje`, `noLeidos` | — | `ConversacionController`, `ConversacionService` |
| `ConfiguracionChatResponse` | record | `silenciado`, `silenciadoHasta`, `archivado` | — | `ConversacionController`, `ConversacionService` |
| `ParticipanteResponse` | record | `usuarioId`, `username`, `nombreCompleto`, `urlAvatar`, `rol`, `fechaUnion` | — | `MiembroController`, `ConversacionService` |
| `UltimoMensajeResponse` | record | `id`, `remitenteId`, `remitenteUsername`, `tipo`, `preview`, `creadoEn`, `eliminado` | — | `ChatResumenResponse`, `ConversacionService` |
| `ChatIndividualResult` | record (interno) | `conversacion`, `creada` | — | `ConversacionController`, `ConversacionService` |

### Mensajes

| DTO | Tipo | Campos | Validaciones | Usado en |
|---|---|---|---|---|
| `EnviarMensajeRequest` | record | `contenido`, `respuestaMensajeId` | `@NotBlank @Size(max=4000)` | Definido pero **no usado** — el controller usa `@RequestPart` directamente |
| `EditarMensajeRequest` | record | `contenido` | `@NotBlank @Size(max=4000)` | `MensajeController`, `MensajeService` |
| `ReaccionRequest` | record | `emoji` | `@NotBlank @Size(max=8)` | `MensajeController`, `MensajeService` |
| `MensajeResponse` | record | `id`, `conversacionId`, `remitenteId`, `contenido`, `tipo`, `creadoEn`, `editadoEn`, `eliminado`, `eliminadoParaTodos`, `respuestaMensaje`, `estados`, `archivo`, `ubicacion`, `reacciones` | — | `MensajeController`, `MensajeService`, `WebSocketBroadcastService` |
| `ReaccionResponse` | record | `usuarioId`, `username`, `emoji`, `creadaEn` | — | `MensajeController`, `MensajeService` |
| `ResumenReaccionesResponse` | record | `emoji`, `cantidad`, `reaccionaste` | — | `MensajeService`, `ReaccionEventPayload` |
| `EstadoMensajeResponse` | record | `usuarioId`, `entregadoEn`, `leidoEn` | — | `MensajeService` → `MensajeResponse.estados` |
| `ArchivoMultimediaResponse` | record | `urlAcceso`, `nombreOriginal`, `contentType`, `tamanioBytes`, `duracionSegundos`, `anchoPx`, `altoPx` | — | `MensajeService` → `MensajeResponse.archivo` |
| `UbicacionResponse` | record | `latitud`, `longitud`, `nombreLugar` | — | `MensajeService` → `MensajeResponse.ubicacion` |
| `RepliedMessageResponse` | record | `id`, `remitenteId`, `contenido`, `eliminado` | — | `MensajeService` → `MensajeResponse.respuestaMensaje` |

### WebSocket

| DTO | Tipo | Campos | Usado en |
|---|---|---|---|
| `WebSocketEvent<T>` | record genérico | `tipo`, `payload` | `WebSocketBroadcastService`, `EscribiendoService` |
| `EscribiendoRequest` | record | `conversacionId` | `PresenciaController` |
| `EscribiendoPayload` | record | `conversacionId`, `usuarioId`, `username` | `EscribiendoService` |
| `PresenciaPayload` | record | `usuarioId`, `username`, `conectado`, `ultimoVisto` | `WebSocketSessionRegistry` |
| `EstadoEntregaEventPayload` | record | `mensajeId`, `conversacionId`, `usuarioId`, `entregadoEn`, `leidoEn` | `MensajeService`, `WebSocketBroadcastService` |
| `ReaccionEventPayload` | record | `mensajeId`, `conversacionId`, `usuarioId`, `emoji`, `resumenActualizado` | `MensajeService`, `WebSocketBroadcastService` |

---

## 10. Seguridad

### Mecanismo de autenticación
Token opaco de sesión (128 caracteres hexadecimales = 64 bytes aleatorios generados con `SecureRandom`). No es JWT. El token se persiste en la tabla `dispositivo_sesion` y se valida en cada request.

### Clases de Spring Security

| Clase | Tipo | Rol |
|---|---|---|
| `TokenAuthFilter` | `OncePerRequestFilter` | Extrae el token del header `Authorization: Bearer {token}` y delega al `AuthenticationManager` |
| `TokenAuthProvider` | `AuthenticationProvider` | Valida el token contra `dispositivo_sesion`, verifica expiración (30 días), actualiza `ultimo_acceso` de forma asíncrona |
| `SecurityConfig` | `@Configuration @EnableWebSecurity` | Configura la cadena de filtros |
| `WebSocketAuthInterceptor` | `ChannelInterceptor` | Valida el token Bearer en el frame STOMP CONNECT, establece `UserPrincipal` como Principal de la sesión WS |
| `UserPrincipal` | `record` que implementa `Principal` | El `getName()` devuelve el UUID del usuario como String — usado por Spring para enrutar `/user/queue/...` |

### Rutas públicas
```
POST /auth/login
POST /usuarios/registro
/swagger-ui/**
/swagger-ui.html
/api-docs
/api-docs/**
/v3/api-docs
/v3/api-docs/**
/ws/**          ← handshake HTTP (la auth real ocurre en STOMP CONNECT)
/ws-sockjs/**
```

### Rutas protegidas
Todas las demás. `anyRequest().authenticated()`.  
Rutas que adicionalmente requieren rol ADMIN dentro del servicio (no configurado en Security sino validado en la lógica):
- `PATCH /chats/{id}`, `DELETE /chats/{id}`
- `POST /chats/{cid}/miembros`, `DELETE /chats/{cid}/miembros/{uid}`

### Cómo se obtiene el usuario autenticado
`@AuthenticationPrincipal UserPrincipal principal` en todos los controllers. `principal.usuarioId()` devuelve el UUID del usuario.

### Política de expiración
30 días desde `ultimo_acceso`. Si el token expira, se elimina la sesión y se lanza `BadCredentialsException`.

### Encoder de contraseñas
`BCryptPasswordEncoder` (bean en `SecurityConfig`).

---

## 11. WebSockets

### Protocolo
STOMP sobre WebSocket (con broker en memoria).

### Endpoints de conexión
| Endpoint | Tipo | Nota |
|---|---|---|
| `/ws` | WebSocket nativo | Para clientes STOMP directos (apps nativas, Postman, wscat) |
| `/ws-sockjs` | SockJS | Fallback para navegadores. `allowedOriginPatterns("*")` |

### Message broker
Broker en memoria con prefijos `/topic` y `/queue`. No hay broker externo (RabbitMQ, ActiveMQ, etc.).  
Prefijo de aplicación: `/app`  
Prefijo de usuarios: `/user`

Límites de transporte:
- Message size limit: 64 KB
- Send buffer: 512 KB
- Send timeout: 20 s

### Topics declarados (servidor → cliente, broadcast)

| Destino | Tipos de eventos | Descripción |
|---|---|---|
| `/topic/conversacion.{conversacionId}` | `NUEVO_MENSAJE`, `NUEVA_REACCION`, `REACCION_ELIMINADA`, `ESCRIBIENDO`, `DEJO_DE_ESCRIBIR` | Todos los participantes de la conversación reciben estos eventos |

### Colas personales (servidor → cliente, unicast)

| Destino | Tipos de eventos | Descripción |
|---|---|---|
| `/user/{usuarioId}/queue/notificaciones` | `ESTADO_ENTREGA`, `PRESENCIA` | Cola privada; Spring resuelve el usuarioId a partir de `UserPrincipal.getName()` |

### `@MessageMapping` (cliente → servidor)

| Destino STOMP | Payload | Acción |
|---|---|---|
| `/app/escribiendo` | `EscribiendoRequest { conversacionId }` | Emite ESCRIBIENDO al topic + programa timeout de 4 s |
| `/app/dejo-de-escribir` | `EscribiendoRequest { conversacionId }` | Cancela timeout y emite DEJO_DE_ESCRIBIR inmediatamente |

### Eventos emitidos por el servidor

| Tipo | Destino | Payload | Cuándo |
|---|---|---|---|
| `NUEVO_MENSAJE` | `/topic/conversacion.{id}` | `MensajeResponse` completo | Tras `MensajeService.enviarMensaje` (AFTER_COMMIT) |
| `NUEVA_REACCION` | `/topic/conversacion.{id}` | `ReaccionEventPayload` | Tras `MensajeService.reaccionar` (AFTER_COMMIT) |
| `REACCION_ELIMINADA` | `/topic/conversacion.{id}` | `ReaccionEventPayload` (emoji=null) | Tras `MensajeService.quitarReaccion` (AFTER_COMMIT) |
| `ESTADO_ENTREGA` | `/user/{remitenteId}/queue/notificaciones` | `EstadoEntregaEventPayload` | Tras envío o marcarTodosLeidos (AFTER_COMMIT), solo si el remitente está conectado |
| `ESCRIBIENDO` | `/topic/conversacion.{id}` | `EscribiendoPayload` | Al recibir `/app/escribiendo` |
| `DEJO_DE_ESCRIBIR` | `/topic/conversacion.{id}` | `EscribiendoPayload` | Al recibir `/app/dejo-de-escribir` o tras 4 s de timeout |
| `PRESENCIA` | `/user/{uid}/queue/notificaciones` | `PresenciaPayload` | En conexión/desconexión WebSocket, según `PrivacidadUltimoVisto` |

### Autenticación WebSocket
`WebSocketAuthInterceptor` intercepta el frame STOMP `CONNECT` y lee el header `Authorization: Bearer {token}`. Si el token es válido, establece `UserPrincipal` como Principal de la sesión. Si es inválido, lanza `MessagingException` → Spring STOMP envía frame `ERROR` y cierra la conexión.

**No se verifica la expiración de 30 días** en el interceptor WebSocket (a diferencia de `TokenAuthProvider`); solo se verifica que el token exista en la BD.

### Gestión de sesiones múltiples
`WebSocketSessionRegistry` mantiene un `ConcurrentHashMap<String, Set<String>>` (usuarioId → sessionIds). La presencia solo se emite en la primera conexión y en la última desconexión, permitiendo múltiples pestañas/dispositivos simultáneos.

---

## 12. Almacenamiento (MinIO)

### Configuración del cliente
```java
// StorageConfig.java
MinioClient.builder()
    .endpoint("http://localhost:9000")
    .credentials("minioadmin", "minioadmin")
    .build()
```
El bucket se crea automáticamente al arrancar mediante `ApplicationRunner` si no existe.

### Nombre del bucket
`messenger-archivos` (configurable en `storage.bucket`)

### Visibilidad del bucket
Privado. El acceso se realiza exclusivamente mediante presigned URLs con validez de 24 horas.

### Prefijos de object keys

| Prefijo | Contenido |
|---|---|
| `avatars/` | Avatares de usuarios y grupos (`avatars/{UUID}.jpg|.png|.webp`) |
| `imagen/` | Imágenes adjuntas en mensajes |
| `audio/` | Audios adjuntos |
| `video/` | Videos adjuntos |
| `documento/` | Documentos adjuntos |
| `sticker/` | Stickers |
| `gif/` | GIFs |

### Límites por tipo de mensaje

| Tipo | MIMEs permitidos | Tamaño máximo |
|---|---|---|
| IMAGEN | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | 10 MB |
| AUDIO | `audio/mpeg`, `audio/ogg`, `audio/opus`, `audio/wav`, `audio/aac` | 20 MB |
| VIDEO | `video/mp4`, `video/webm`, `video/ogg` | 100 MB |
| DOCUMENTO | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/plain` | 50 MB |
| STICKER | `image/webp` | 512 KB |
| GIF | `image/gif` | 5 MB |
| Avatar | `image/jpeg`, `image/png`, `image/webp` | 5 MB |

### Métodos de StorageService

| Método | Descripción |
|---|---|
| `subir(MultipartFile, TipoMensaje)` → `StorageResult` | Valida MIME (Tika) + tamaño, sube a MinIO |
| `subirAvatar(MultipartFile)` → `String objectKey` | Valida MIME + tamaño (5 MB), sube a `avatars/` |
| `generarPresignedUrl(String objectKey)` → `String` | URL firmada válida 24 h |
| `eliminar(String objectKey)` → `void` | Elimina objeto de MinIO (best-effort) |

### Cómo se sirven los archivos
**Proxy con redirect:** `GET /archivos/{objectKey}` requiere autenticación Bearer, genera una presigned URL válida 24 h y responde `302 Found` con `Location: {presigned_url}`. El cliente descarga directamente desde MinIO.

---

## 13. Manejo de errores

### Excepciones personalizadas

| Clase | Extiende | Cuándo se lanza |
|---|---|---|
| `RecursoNoEncontradoException` | `RuntimeException` | Entidad no encontrada en BD |
| `AccesoDenegadoException` | `RuntimeException` | Usuario sin permisos (no participante, no admin) |
| `TipoArchivoNoPermitidoException` | `RuntimeException` | MIME type no está en la whitelist |
| `ArchivoDemasiadoGrandeException` | `RuntimeException` | Archivo supera el límite del tipo |

### `GlobalExceptionHandler` (`@RestControllerAdvice`)

| Excepción | HTTP Status | Código en body |
|---|---|---|
| `RecursoNoEncontradoException` | 404 Not Found | `NOT_FOUND` |
| `AccesoDenegadoException` | 403 Forbidden | `FORBIDDEN` |
| `BadCredentialsException` | 401 Unauthorized | `UNAUTHORIZED` |
| `MethodArgumentNotValidException` | 400 Bad Request | `VALIDATION_ERROR` |
| `ConstraintViolationException` | 400 Bad Request | `VALIDATION_ERROR` |
| `DataIntegrityViolationException` | 409 Conflict | `CONFLICT` |
| `IllegalArgumentException` | 400 Bad Request | `BAD_REQUEST` |
| `IllegalStateException` | 400 Bad Request | `OPERACION_INVALIDA` |
| `TipoArchivoNoPermitidoException` | 415 Unsupported Media Type | `TIPO_NO_PERMITIDO` |
| `ArchivoDemasiadoGrandeException` | 413 Content Too Large | `ARCHIVO_DEMASIADO_GRANDE` |
| `MaxUploadSizeExceededException` | 413 Content Too Large | `ARCHIVO_DEMASIADO_GRANDE` |

### Formato de respuesta de error
```json
{
  "codigo": "NOT_FOUND",
  "mensaje": "Conversación no encontrada",
  "timestamp": "2026-04-28T15:30:00"
}
```

---

## 14. Eventos de dominio

### `MensajeEnviadoEvent`
```
Evento: MensajeEnviadoEvent
  Payload: MensajeResponse
  Publicado en: MensajeService.enviarMensaje()
  Escuchado en: WebSocketBroadcastService.onMensajeEnviado()
  @TransactionalEventListener: AFTER_COMMIT
  Acción: broadcast NUEVO_MENSAJE → /topic/conversacion.{id}
```

### `EstadoEntregaEvent`
```
Evento: EstadoEntregaEvent
  Payload: EstadoEntregaEventPayload (mensajeId, conversacionId, usuarioId, entregadoEn, leidoEn)
  Publicado en:
    - MensajeService.enviarMensaje() → uno por receptor (entregadoEn = ahora, leidoEn = null)
    - MensajeService.marcarTodosLeidos() → uno por mensaje pendiente (entregadoEn = null, leidoEn = ahora)
  Escuchado en: WebSocketBroadcastService.onEstadoEntrega()
  @TransactionalEventListener: AFTER_COMMIT
  Acción: si el remitente está conectado → envía ESTADO_ENTREGA → /user/{remitenteId}/queue/notificaciones
```

### `ReaccionEvent`
```
Evento: ReaccionEvent
  Payload: (tipo: String, payload: ReaccionEventPayload)
  Publicado en:
    - MensajeService.reaccionar() → tipo = "NUEVA_REACCION"
    - MensajeService.quitarReaccion() → tipo = "REACCION_ELIMINADA"
  Escuchado en: WebSocketBroadcastService.onReaccion()
  @TransactionalEventListener: AFTER_COMMIT
  Acción: broadcast → /topic/conversacion.{id}
```

---

## 15. Tareas programadas

No existe ningún `@Scheduled`, `@EnableScheduling`, ni `ScheduledExecutorService` declarado como bean de Spring.

La única tarea con scheduling es el timer de escritura en `EscribiendoService`, que usa un `Executors.newSingleThreadScheduledExecutor()` creado manualmente (hilo daemon, no gestionado por Spring). No hay control de ciclo de vida ni shutdown hook.

---

## 16. Lo que falta por implementar

### DTOs sin uso
- **`EnviarMensajeRequest`** — está definido con campos `contenido` y `respuestaMensajeId`, pero `MensajeController.enviarMensaje` no lo usa. Recibe los campos como `@RequestPart` individuales en multipart. Este DTO es un artefacto que debería eliminarse o conectarse.

### Repositorios con métodos sin invocaciones
- **`ArchivoMultimediaRepository`** — no tiene queries personalizadas y ningún servicio lo inyecta directamente. El guardado de `ArchivoMultimedia` se hace a través de la cascada de `Mensaje`.
- **`ReaccionRepository.existsByIdMensajeIdAndIdUsuarioIdAndEmoji`** — definido pero nunca llamado en ningún servicio.

### Dependencia declarada pero sin uso
- **`spring-boot-starter-data-redis-reactive`** — declarada en `pom.xml` y en los starters de test. No existe ningún `RedisRepository`, `ReactiveRedisTemplate`, `@EnableRedisRepositories`, ni configuración de conexión a Redis en el código fuente ni en `application.properties`. Esta dependencia genera classpath innecesario y podría causar errores de auto-configuración en arranque si no hay servidor Redis disponible.

### MapStruct declarado pero sin mappers
- `mapstruct` y `mapstruct-processor` están declarados en el `pom.xml` pero no hay ninguna interfaz `@Mapper` en el proyecto. Además, `mapstruct-processor` no está configurado en `annotationProcessorPaths` del `maven-compiler-plugin` (solo aparece `lombok`). Esto impediría la generación de código de MapStruct aunque se creen mappers.

### Nombre de campo potencialmente engañoso
- **`Mensaje.contenidoCifrado`** / columna `contenido_cifrado` — el nombre sugiere que el contenido está cifrado, pero no hay ninguna implementación de cifrado en el código. El contenido se almacena y se lee en texto plano. Si el cifrado es un requisito, no está implementado.

### Falta de expiración en WebSocket
- `WebSocketAuthInterceptor` verifica que el token exista en BD, pero no verifica la expiración de 30 días (a diferencia de `TokenAuthProvider`). Un token expirado puede usarse indefinidamente para mantener conexiones WebSocket abiertas.

### Ausencia de shutdown del scheduler
- El `ScheduledExecutorService` en `EscribiendoService` se crea con `Executors.newSingleThreadScheduledExecutor()` y no implementa `DisposableBean` ni `@PreDestroy`. Al detener la aplicación, el hilo daemon puede no cerrarse limpiamente.

### Push notifications sin implementar
- `DispositivoSesion` tiene campos `tokenPush` y `plataformaPush`, pero no hay ningún servicio, endpoint ni lógica que los utilice para enviar notificaciones push a dispositivos móviles.

### Sin paginación en la lista de bloqueos
- `BloqueoController.listar` devuelve `List<BloqueoResponse>` sin paginación. No es un problema funcional pero puede ser un problema de rendimiento con muchos bloqueos.

### Sin pruebas
No existe ningún archivo de test bajo `src/test/java/`. Los starters de test están declarados en `pom.xml` pero no hay clases de test implementadas.

### Sin perfiles de entorno
No hay `application-dev.properties`, `application-prod.properties`, ni uso de `@Profile`. Las credenciales de BD y MinIO están hardcodeadas en `application.properties`.

### Sin sistema de migraciones (ver sección 17)

---

## 17. Migraciones SQL pendientes

**No hay sistema de migraciones configurado.**

- No existe Flyway ni Liquibase en las dependencias.
- No hay directorio `src/main/resources/db/migration/` ni scripts SQL.
- El schema se gestiona mediante `spring.jpa.hibernate.ddl-auto=update`, que aplica cambios de forma incremental pero no es seguro en producción (no hace rollback, no elimina columnas, no valida integridad).

**Implicaciones:**
- No hay historial de cambios de esquema.
- No hay forma de reproducir el schema en un entorno limpio sin levantar la app con `ddl-auto=create`.
- Si se modifica una entidad JPA, Hibernate intentará `ALTER TABLE` automáticamente, lo que puede fallar silenciosamente en casos complejos.

---

*Fin del reporte. Archivos auditados: 96 Java + pom.xml + application.properties.*
