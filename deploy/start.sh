#!/bin/sh
set -e

envsubst '${PORT} ${BACKEND_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/http.d/default.conf

cd /app/backend

if [ -n "$DATABASE_URL" ]; then
  npx prisma migrate deploy
fi

node dist/server.js &

nginx -g "daemon off;"
