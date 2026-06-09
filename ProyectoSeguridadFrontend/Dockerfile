FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Valores de cifrado inyectados como build args desde docker-compose
ARG NG_APP_API_CRYPTO_ALGORITHM=DES_CBC
ARG NG_APP_API_CRYPTO_SECRET
ARG NG_APP_WS_CRYPTO_ALGORITHM=CHACHA20
ARG NG_APP_WS_CRYPTO_SECRET

# Reemplaza los marcadores DOCKER_* en environment.production.ts con los
# valores reales. Los secretos no deben contener el carácter '%'.
RUN sed -i \
    -e "s%DOCKER_API_ALGO%${NG_APP_API_CRYPTO_ALGORITHM}%g" \
    -e "s%DOCKER_API_SECRET%${NG_APP_API_CRYPTO_SECRET}%g" \
    -e "s%DOCKER_WS_ALGO%${NG_APP_WS_CRYPTO_ALGORITHM}%g" \
    -e "s%DOCKER_WS_SECRET%${NG_APP_WS_CRYPTO_SECRET}%g" \
    src/environments/environment.production.ts

RUN npm run build

# ── Etapa de producción: nginx sirve los estáticos ──────────────
FROM nginx:alpine

COPY --from=build /app/dist/seguridad-front/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
