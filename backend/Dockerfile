FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN npx tsc

EXPOSE 8000

CMD ["node", "dist/server.js"]
