FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/prisma ./prisma/
RUN npx prisma generate

COPY backend ./
RUN npx tsc

FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

ARG VITE_API_BASE_URL=/api
ARG VITE_APP_NAME=Digital Estate
ARG VITE_AUTH_STORAGE_PREFIX=digital-estate
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_AUTH_STORAGE_PREFIX=$VITE_AUTH_STORAGE_PREFIX
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME
ENV VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache nginx gettext

ENV NODE_ENV=production
ENV BACKEND_PORT=5000
ENV PORT=10000

WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 10000

CMD ["/app/start.sh"]
