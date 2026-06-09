#!/bin/sh
set -e

# ── PostgreSQL: Railway inyecta DATABASE_URL automáticamente ──────
# Formato Railway: postgresql://user:pass@host:port/db
# Spring necesita: jdbc:postgresql://host:port/db (user/pass separados)
if [ -n "$DATABASE_URL" ]; then
    export SPRING_DATASOURCE_URL="jdbc:$(echo "$DATABASE_URL" | sed 's|postgresql://[^@]*@|postgresql://|')"
    DB_USERINFO="$(echo "$DATABASE_URL" | sed 's|postgresql://||' | cut -d@ -f1)"
    export SPRING_DATASOURCE_USERNAME="$(echo "$DB_USERINFO" | cut -d: -f1)"
    export SPRING_DATASOURCE_PASSWORD="$(echo "$DB_USERINFO" | cut -d: -f2)"
fi

# ── MinIO public URL: usa el dominio Railway si no se configuró ───
# Las presigned URLs deben apuntar al dominio público, no a localhost.
if [ -n "$RAILWAY_PUBLIC_DOMAIN" ] && [ -z "$STORAGE_PUBLIC_URL" ]; then
    export STORAGE_PUBLIC_URL="https://${RAILWAY_PUBLIC_DOMAIN}"
fi
# El endpoint interno siempre es localhost (Spring → MinIO dentro del contenedor)
export STORAGE_ENDPOINT="${STORAGE_ENDPOINT:-http://localhost:9000}"

# ── Puerto público (Railway lo inyecta) ───────────────────────────
export PORT="${PORT:-8080}"

# ── Directorio de datos de MinIO ──────────────────────────────────
mkdir -p /data/minio

# ── nginx: sustituye ${PORT} en la plantilla ─────────────────────
envsubst '${PORT}' < /etc/nginx/nginx-railway.conf.template \
    > /etc/nginx/http.d/default.conf

exec supervisord -c /etc/supervisord.conf
