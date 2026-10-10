# Production image for the API.
FROM node:22-alpine

RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY scripts ./scripts

ENV NODE_ENV=production
USER node
EXPOSE 3001

# Applies pending migrations, then starts the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
