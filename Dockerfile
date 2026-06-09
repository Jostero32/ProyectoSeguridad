# ════════════════════════════════════════════════════════════════════
#  Imagen única: Angular (nginx) + Spring Boot (JVM) con supervisord
#  Para Railway: sube este repo, apunta a este Dockerfile.
# ════════════════════════════════════════════════════════════════════

# ── Stage 1: Build Angular ────────────────────────────────────────
FROM node:22-alpine AS frontend
WORKDIR /app
COPY ProyectoSeguridadFrontend/package*.json ./
RUN npm ci --silent
COPY ProyectoSeguridadFrontend/ .

ARG NG_APP_API_CRYPTO_ALGORITHM=DES_CBC
ARG NG_APP_API_CRYPTO_SECRET
ARG NG_APP_WS_CRYPTO_ALGORITHM=CHACHA20
ARG NG_APP_WS_CRYPTO_SECRET

RUN sed -i \
    -e "s%DOCKER_API_ALGO%${NG_APP_API_CRYPTO_ALGORITHM}%g" \
    -e "s%DOCKER_API_SECRET%${NG_APP_API_CRYPTO_SECRET}%g" \
    -e "s%DOCKER_WS_ALGO%${NG_APP_WS_CRYPTO_ALGORITHM}%g" \
    -e "s%DOCKER_WS_SECRET%${NG_APP_WS_CRYPTO_SECRET}%g" \
    src/environments/environment.production.ts

RUN npm run build

# ── Stage 2: Build Spring Boot ────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS backend
WORKDIR /app
COPY ProyectoSeguridadBackend/pom.xml .
RUN mvn dependency:go-offline -q
COPY ProyectoSeguridadBackend/src ./src
RUN mvn package -DskipTests -q

# ── Stage 3: Imagen final ─────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

# nginx + supervisord + envsubst (para sustituir $PORT en nginx.conf)
RUN apk add --no-cache nginx supervisor gettext && \
    mkdir -p /run/nginx

# Estáticos de Angular
COPY --from=frontend /app/dist/seguridad-front/browser /usr/share/nginx/html

# JAR del backend
COPY --from=backend /app/target/*.jar /app/app.jar

# Configuraciones
COPY nginx-railway.conf /etc/nginx/nginx-railway.conf.template
COPY supervisord.conf    /etc/supervisord.conf
COPY startup.sh          /startup.sh
RUN chmod +x /startup.sh

# Railway inyecta $PORT; nginx escucha en ese puerto, Spring Boot en 8080 interno
EXPOSE 8080
CMD ["/startup.sh"]
