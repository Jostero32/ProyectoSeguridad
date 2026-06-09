#!/bin/sh
# Railway inyecta $PORT; si no existe usa 8080 como fallback
export PORT="${PORT:-8080}"

# Sustituye ${PORT} en la plantilla nginx y escribe el conf final
envsubst '${PORT}' < /etc/nginx/nginx-railway.conf.template \
    > /etc/nginx/conf.d/default.conf

exec supervisord -c /etc/supervisord.conf
