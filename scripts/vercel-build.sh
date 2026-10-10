#!/bin/sh
# Vercel build: generate the Prisma client, apply migrations, build the frontend.
set -e

cd apps/api
npx prisma generate
# Migrations need a direct (non-pooled) connection. Neon's Vercel integration
# provides it as DATABASE_URL_UNPOOLED; otherwise DATABASE_URL is used.
DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" npx prisma migrate deploy
cd ../web
npm run build
