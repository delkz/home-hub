# Builds the static frontend and serves it with Caddy, which also terminates
# HTTPS (automatic Let's Encrypt certificates) and proxies /api to the API.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
