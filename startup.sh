#!/bin/sh
# Railway inyecta $PORT; nginx escucha en ese puerto
export PORT="${PORT:-8080}"

# Directorio de datos de MinIO (Railway Volume montado en /data)
mkdir -p /data/minio

# Sustituye ${PORT} en la plantilla nginx
envsubst '${PORT}' < /etc/nginx/nginx-railway.conf.template \
    > /etc/nginx/conf.d/default.conf

exec supervisord -c /etc/supervisord.conf
