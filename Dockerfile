FROM node:20-alpine AS base

# Установка production зависимостей
FROM base AS deps
WORKDIR /app

COPY package*.json ./
COPY linkoo_shared ./linkoo_shared

RUN cd linkoo_shared && npm install && npm run build

RUN npm pkg set dependencies."@local/linkoo_shared"="file:./linkoo_shared"

RUN npm ci --omit=dev && npm cache clean --force

# Сборка TypeScript приложения
FROM base AS builder
WORKDIR /app


COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/linkoo_shared ./linkoo_shared


COPY package*.json ./
COPY tsconfig.json ./

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
COPY --from=deps /app/linkoo_shared ./linkoo_shared

COPY --from=builder /app/dist ./dist

COPY package.json ./

RUN mkdir -p uploads

RUN echo "=== Final structure ===" && ls -la && ls -la dist/

EXPOSE 5000

CMD ["node", "dist/server.js"]
