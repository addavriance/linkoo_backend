FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app

ARG GITHUB_TOKEN

COPY package*.json ./
RUN echo "@addavriance:registry=https://npm.pkg.github.com" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc && \
    npm install && \
    rm -f .npmrc && \
    npm cache clean --force

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

RUN echo "=== Build output ===" && ls -la dist/

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache wget

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

COPY package.json ./

RUN mkdir -p uploads

RUN echo "=== Final structure ===" && ls -la && ls -la dist/

EXPOSE 5000

CMD ["node", "dist/server.js"]
