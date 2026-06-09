# Estado de mensajes multimedia y tipos de archivo

Auditoría de solo lectura sobre los archivos relacionados con el envío y la
representación de mensajes multimedia. Refleja el estado del código a
2026-04-29 en la rama `feature/chats`.

---

## 1. `shared/enums/TipoMensaje.java`

Enum plano (sin propiedades), 8 valores:

```java
public enum TipoMensaje {
    TEXTO, IMAGEN, AUDIO, VIDEO, DOCUMENTO, UBICACION, STICKER, GIF
}
```

Comportamiento por valor según el resto del código:

| Valor       | Necesita archivo | Necesita coordenadas | Necesita contenido |
|-------------|------------------|----------------------|--------------------|
| `TEXTO`     | no               | no                   | sí                 |
| `IMAGEN`    | sí               | no                   | no                 |
| `AUDIO`     | sí               | no                   | no                 |
| `VIDEO`     | sí               | no                   | no                 |
| `DOCUMENTO` | sí               | no                   | no                 |
| `STICKER`   | sí               | no                   | no                 |
| `GIF`       | sí               | no                   | no                 |
| `UBICACION` | no               | sí                   | no                 |

---

## 2. `mensajes/model/ArchivoMultimedia.java`

Tabla `archivo_multimedia`. PK compartida con `mensaje` vía `@MapsId`.

```java
@Id
@Column(name = "mensaje_id")
private UUID mensajeId;

@OneToOne(fetch = FetchType.LAZY)
@MapsId
@JoinColumn(name = "mensaje_id")
private Mensaje mensaje;

@Column(name = "nombre_original", nullable = false)
private String nombreOriginal;

@Column(name = "object_key", nullable = false, unique = true)
private String objectKey;

@Column(name = "content_type", nullable = false)
private String contentType;

@Column(name = "tamanio_bytes", nullable = false)
private long tamanioBytes;
```

Resumen de columnas:

| Campo Java       | Columna           | Tipo     | Nullable | Otros            |
|------------------|-------------------|----------|----------|------------------|
| `mensajeId`      | `mensaje_id`      | `UUID`   | no (PK)  | `@MapsId`        |
| `nombreOriginal` | `nombre_original` | `String` | no       |                  |
| `objectKey`      | `object_key`      | `String` | no       | `unique = true`  |
| `contentType`    | `content_type`    | `String` | no       |                  |
| `tamanioBytes`   | `tamanio_bytes`   | `long`   | no       |                  |

### Campos eliminados en refactorizaciones previas

Los siguientes campos **ya no existen** en la entidad (no se encuentran en el
código fuente actual):

- `duracionSegundos` — eliminado.
- `anchoPx` — eliminado.
- `altoPx` — eliminado.
- `urlArchivo` — renombrado a `objectKey` con columna `object_key` (ver
  memoria del proyecto: storage privado con presigned URLs).

### Thumbnail

**No existe ningún campo de thumbnail** en `ArchivoMultimedia`. No hay
`thumbnailKey`, `urlThumbnail`, `miniatura`, `previewKey` ni equivalente.
Tampoco aparece en `ArchivoMultimediaResponse`, `StorageService` ni
`MensajeMapper`.

---

## 3. `mensajes/controller/MensajeController.java` — `POST /chats/{conversacionId}/mensajes`

Endpoint multipart con el siguiente método:

```java
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@ResponseStatus(HttpStatus.CREATED)
public MensajeResponse enviarMensaje(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID conversacionId,
        @RequestPart String tipo,
        @RequestPart(required = false) String contenido,
        @RequestPart(required = false) MultipartFile archivo,
        @RequestPart(required = false) String respuestaMensajeId,
        @RequestPart(required = false) String latitud,
        @RequestPart(required = false) String longitud,
        @RequestPart(required = false) String nombreLugar) { ... }
```

### `@RequestPart` recibidos

| Part                  | Tipo            | Obligatorio | Notas                                             |
|-----------------------|-----------------|-------------|---------------------------------------------------|
| `tipo`                | `String`        | sí          | Se convierte con `TipoMensaje.valueOf(toUpper)`   |
| `contenido`           | `String`        | no          | Solo para `TEXTO`                                 |
| `archivo`             | `MultipartFile` | no          | Para `IMAGEN/AUDIO/VIDEO/DOCUMENTO/STICKER/GIF`   |
| `respuestaMensajeId`  | `String` (UUID) | no          | Convertido a `UUID` antes de pasar al service     |
| `latitud`             | `String`        | no          | Parseado a `BigDecimal` con `parseBigDecimalOrNull` |
| `longitud`            | `String`        | no          | idem                                              |
| `nombreLugar`         | `String`        | no          | Solo para `UBICACION`                             |

### Detección del tipo de mensaje

No hay detección heurística: el cliente envía el part `tipo` como string y el
controller lo mapea directamente con
`TipoMensaje.valueOf(tipo.toUpperCase())`. La validación de coherencia entre
`tipo` y los demás parts se delega al service.

### Campos pasados al service

El controller invoca:

```java
mensajeService.enviarMensaje(
        conversacionId,
        principal.usuarioId(),
        TipoMensaje.valueOf(tipo.toUpperCase()),
        contenido,
        respuestaMensajeId != null ? UUID.fromString(respuestaMensajeId) : null,
        archivo,
        parseBigDecimalOrNull(latitud),
        parseBigDecimalOrNull(longitud),
        nombreLugar
);
```

---

## 4. `mensajes/service/MensajeService.java`

### Firma exacta de `enviarMensaje`

```java
public MensajeResponse enviarMensaje(UUID conversacionId, UUID usuarioId,
                                     TipoMensaje tipo,
                                     String contenido,
                                     UUID respuestaMensajeId,
                                     MultipartFile archivo,
                                     BigDecimal latitud,
                                     BigDecimal longitud,
                                     String nombreLugar)
```

### Construcción de `ArchivoMultimedia`

Solo se ejecuta cuando `tipo != TEXTO && tipo != UBICACION`:

```java
StorageService.StorageResult result = storageService.subir(archivo, tipo);
ArchivoMultimedia am = new ArchivoMultimedia();
am.setMensaje(mensajeGuardado);
am.setNombreOriginal(archivo.getOriginalFilename() != null
        ? archivo.getOriginalFilename() : "archivo");
am.setObjectKey(result.objectKey());
am.setContentType(result.contentType());
am.setTamanioBytes(result.tamanioBytes());
mensajeGuardado.setArchivo(am);
```

Campos seteados: `mensaje`, `nombreOriginal`, `objectKey`, `contentType`,
`tamanioBytes`. **No se setea ningún campo de thumbnail, dimensiones ni
duración** — esos campos no existen en la entidad.

### Construcción de `toResponse` para el archivo

La transformación a DTO no la hace el service: la delega a
`MensajeMapper.toResponse(...)`, que internamente llama a
`mapArchivo(ArchivoMultimedia)`:

```java
private ArchivoMultimediaResponse mapArchivo(ArchivoMultimedia archivo) {
    if (archivo == null) {
        return null;
    }
    return new ArchivoMultimediaResponse(
            "/archivos/" + archivo.getObjectKey(),
            archivo.getNombreOriginal(),
            archivo.getContentType(),
            archivo.getTamanioBytes()
    );
}
```

Campos incluidos en el response del archivo: `urlAcceso`
(`/archivos/{objectKey}`), `nombreOriginal`, `contentType`, `tamanioBytes`.

El payload se envuelve en `MultimediaPayload` para los tipos
`IMAGEN, AUDIO, VIDEO, DOCUMENTO, STICKER, GIF`:

```java
case IMAGEN, AUDIO, VIDEO, DOCUMENTO, STICKER, GIF ->
    new MultimediaPayload(mapArchivo(mensaje.getArchivo()));
```

---

## 5. `shared/service/StorageService.java`

### Firma de subida de archivos de mensaje

El nombre real del método es `subir` (no `subirArchivoMensaje`):

```java
public StorageResult subir(MultipartFile archivo, TipoMensaje tipo)

public record StorageResult(String objectKey, String contentType, long tamanioBytes) {}
```

Devuelve un record `StorageResult` con tres campos: `objectKey`,
`contentType` (detectado con Apache Tika), `tamanioBytes`.

### Prefijos del object key por tipo

El prefijo se genera dinámicamente con `tipo.name().toLowerCase()`:

```java
String objectKey = tipo.name().toLowerCase() + "/" + UUID.randomUUID() + extension;
```

Los prefijos resultantes son:

| Tipo        | Prefijo en MinIO |
|-------------|------------------|
| `IMAGEN`    | `imagen/`        |
| `AUDIO`     | `audio/`         |
| `VIDEO`     | `video/`         |
| `DOCUMENTO` | `documento/`     |
| `STICKER`   | `sticker/`       |
| `GIF`       | `gif/`           |

`TEXTO` y `UBICACION` no se suben — el método nunca se llama para ellos.

### MIME types permitidos por tipo

```java
private static final Map<TipoMensaje, Set<String>> TIPOS_PERMITIDOS = Map.of(
        TipoMensaje.IMAGEN,    Set.of("image/jpeg", "image/png", "image/webp", "image/gif"),
        TipoMensaje.AUDIO,     Set.of("audio/mpeg", "audio/ogg", "audio/opus", "audio/wav", "audio/aac"),
        TipoMensaje.VIDEO,     Set.of("video/mp4", "video/webm", "video/ogg"),
        TipoMensaje.DOCUMENTO, Set.of(
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/plain"
        ),
        TipoMensaje.STICKER,   Set.of("image/webp"),
        TipoMensaje.GIF,       Set.of("image/gif")
);
```

### Tamaños máximos por tipo

```java
private static final Map<TipoMensaje, Long> TAMANIOS_MAX = Map.of(
        TipoMensaje.IMAGEN,    10L  * 1024 * 1024, // 10 MB
        TipoMensaje.AUDIO,     20L  * 1024 * 1024, // 20 MB
        TipoMensaje.VIDEO,     100L * 1024 * 1024, // 100 MB
        TipoMensaje.DOCUMENTO, 50L  * 1024 * 1024, // 50 MB
        TipoMensaje.STICKER,   512L * 1024,        // 512 KB
        TipoMensaje.GIF,       5L   * 1024 * 1024  // 5 MB
);
```

> Nota: la detección de MIME se hace con Apache Tika sobre los bytes
> (`TIKA.detect(bytes)`), no sobre el header `Content-Type` del cliente.

---

## 6. `mensajes/dto/ArchivoMultimediaResponse.java`

```java
public record ArchivoMultimediaResponse(
        String urlAcceso,
        String nombreOriginal,
        String contentType,
        long tamanioBytes
) {}
```

Campos: `urlAcceso`, `nombreOriginal`, `contentType`, `tamanioBytes`.

### Campos eliminados / ausentes

- **No existe** `urlThumbnail`, `thumbnailKey`, `miniatura` ni equivalente.
- **No existe** `duracionSegundos` (quitado en refactor previo).
- **No existe** `anchoPx` ni `altoPx` (quitado en refactor previo).
- `urlAcceso` reemplaza al antiguo `urlArchivo` y siempre toma la forma
  `"/archivos/{objectKey}"` — punto contra el endpoint autenticado, no contra
  MinIO directamente.

---

## 7. Resumen — campos eliminados y ausencia de thumbnail

| Concepto             | ¿Existe hoy? | Ubicación esperada                |
|----------------------|--------------|-----------------------------------|
| `duracionSegundos`   | **No**       | sería en `ArchivoMultimedia`      |
| `anchoPx`            | **No**       | sería en `ArchivoMultimedia`      |
| `altoPx`             | **No**       | sería en `ArchivoMultimedia`      |
| `thumbnailKey`       | **No**       | sería en `ArchivoMultimedia`      |
| `urlThumbnail`       | **No**       | sería en `ArchivoMultimediaResponse` |
| `urlArchivo`         | **No** (renombrado) | sustituido por `objectKey` + `urlAcceso` |

El modelo actual de archivo multimedia es deliberadamente mínimo: solo
metadatos esenciales (nombre, mime, tamaño, object key). Cualquier
funcionalidad de previsualización de imagen/video/audio (miniaturas,
dimensiones, duración) requeriría re-introducir esos campos tanto en
`ArchivoMultimedia` (entidad + columnas) como en `ArchivoMultimediaResponse`
(record), y ampliar `StorageService.subir` para producir los binarios y
object keys correspondientes.
