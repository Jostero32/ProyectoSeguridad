# CipherChat Frontend

Frontend del proyecto **CipherChat**, una plataforma de mensajería segura desarrollada con Angular.

La aplicación consume el backend de mensajería ubicado en la rama `develop` del repositorio backend y maneja autenticación por token Bearer, rutas protegidas, formularios reactivos y una interfaz visual inspirada en Messenger con tema oscuro.

---

## Tecnologías principales

- Angular 21.1.3
- TypeScript
- TailwindCSS
- Angular Standalone Components
- Angular Signals
- Reactive Forms
- Angular Router
- HTTP Interceptors

---

## Funcionalidades implementadas en esta rama

Esta rama corresponde al feature inicial de autenticación del frontend.

Incluye:

- Layout público de autenticación.
- Diseño visual oscuro con tonos negro, rosa, fucsia y morado.
- Pantalla de inicio de sesión.
- Pantalla de registro de usuario.
- Pantalla para recuperar contraseña mediante correo.
- Pantalla para restablecer contraseña mediante token recibido por enlace.
- Mostrar/ocultar contraseña en formularios.
- Validaciones visuales en formularios.
- Manejo de estados de carga.
- Manejo de mensajes de error y éxito.
- Guardado de sesión con token Bearer.
- Interceptor HTTP para enviar automáticamente `Authorization: Bearer {token}`.
- Guard para rutas privadas.
- Guard para rutas públicas.
- Configuración de environments para desarrollo y producción.
- Configuración centralizada de endpoints.

---

## Estructura principal del proyecto

```txt
src/
  app/
    config/
      api.config.ts

    core/
      auth/
      guards/
      interceptors/

    layout/
      auth-layout/
      messenger-layout/

    shared/

    features/
      auth/
        models/
        services/
        pages/
          login-page/
          register-page/
          forgot-password-page/
          reset-password-page/

      users/
        models/
        services/

      chats/
        pages/

    pages/
      not-found/

  environments/
    environment.ts
    environment.development.ts
    environment.production.ts
```

---

## Requisitos previos

Antes de ejecutar el frontend, asegúrate de tener instalado:

- Node.js
- npm
- Angular CLI

Verifica las versiones con:

```bash
node -v
npm -v
ng version
```

---

## Instalación

Instalar dependencias del proyecto:

```bash
npm install
```

---

## Servidor de desarrollo

Para iniciar el frontend en modo desarrollo:

```bash
ng serve
```

Luego abre el navegador en:

```txt
http://localhost:4200
```

---

## Backend requerido

El frontend espera que el backend esté disponible en:

```txt
http://localhost:8080
```

La configuración se encuentra en:

```txt
src/environments/environment.development.ts
```

Valores usados en desarrollo:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  wsUrl: 'ws://localhost:8080/ws',
  sockJsUrl: 'http://localhost:8080/ws-sockjs',
};
```

---

## Variables y configuración por ambiente

El proyecto usa archivos de ambiente:

```txt
src/environments/environment.ts
src/environments/environment.development.ts
src/environments/environment.production.ts
```

La URL base del backend no debe escribirse directamente en componentes o servicios.  
Debe centralizarse mediante:

```txt
src/app/config/api.config.ts
```

---

## Endpoints usados en autenticación

Actualmente el frontend utiliza o deja preparados los siguientes endpoints:

```txt
POST /auth/login
POST /auth/logout
POST /auth/logout-all
GET  /auth/sesiones

POST /usuarios/registro
GET  /usuarios/me

POST /auth/forgot-password
POST /auth/reset-password
```

> Nota: los endpoints de recuperación de contraseña deben existir también en el backend para que el flujo sea completamente funcional.

---

## Flujo de autenticación

1. El usuario inicia sesión con email y contraseña.

2. El backend responde con:

```json
{
  "token": "TOKEN_GENERADO",
  "usuarioId": "UUID_USUARIO"
}
```

3. El frontend guarda el token y el ID del usuario.

4. El interceptor HTTP agrega automáticamente en cada petición protegida:

```txt
Authorization: Bearer TOKEN_GENERADO
```

5. Las rutas privadas quedan protegidas mediante guard.

6. En caso de error `401`, la sesión se limpia y el usuario vuelve al login.

---

## Rutas principales

```txt
/auth/login
/auth/registro
/auth/recuperar-password
/auth/restablecer-password?token=TOKEN_GENERADO
/messenger
```

---

## Comandos útiles

Ejecutar en desarrollo:

```bash
ng serve
```

Construir para producción:

```bash
ng build --configuration production
```

Ejecutar pruebas unitarias:

```bash
ng test
```

---

## Build

Para compilar el proyecto:

```bash
ng build
```

Los archivos generados se almacenan en:

```txt
dist/
```

---

## Estado actual

Esta rama deja lista la base visual y funcional del módulo de autenticación.

Pendiente para siguientes ramas:

- Conectar listado real de chats.
- Conectar historial de mensajes.
- Implementar envío de mensajes.
- Integrar WebSocket STOMP.
- Manejar presencia de usuarios.
- Manejar eventos de escribiendo.
- Manejar reacciones y estados de entrega.
- Implementar perfil y actualización de avatar.
- Implementar bloqueo/desbloqueo de usuarios desde la interfaz.

---

## Convención de ramas sugerida

```txt
feature/auth-ui
feature/chats-ui
feature/messages-ui
feature/websocket
feature/profile-settings
```

---

## Commit sugerido

```bash
git add .
git commit -m "feat(auth): implement dark authentication UI and session flow"
```

---
