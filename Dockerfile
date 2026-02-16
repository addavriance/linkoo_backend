FROM node:20-alpine AS base

# Установка production зависимостей
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Сборка TypeScript приложения
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Проверяем что собралось
RUN echo "=== Build output ===" && ls -la dist/

# Финальный образ
FROM base AS runner
WORKDIR /app

# Установка wget для healthcheck
RUN apk add --no-cache wget

COPY --from=deps /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

COPY package.json ./

RUN mkdir -p uploads

RUN echo "=== Final structure ===" && ls -la && ls -la dist/

EXPOSE 5000

CMD ["node", "dist/server.js"]
