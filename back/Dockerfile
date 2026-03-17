FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS deps

RUN npm ci

FROM deps AS build

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src

# Prisma 7 uses prisma.config.ts during generation. The value only needs
# to exist at build time; the real runtime connection string is injected by Compose.
ENV DATABASE_URL=postgresql://streamady:streamady_password@db:5432/streamady?schema=public

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY prisma.config.ts ./
COPY data ./data

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
