# Linkoo Backend API

RESTful API для платформы цифровых визиток Linkoo.

## Особенности

- **OAuth 2.0**: Google, VK, Discord, GitHub
- **JWT Authentication**: Access & Refresh tokens
- **MongoDB**: База данных
- **TypeScript**: Полная типизация
- **Express**: Web framework + Zod validation

## Установка

```bash
npm install
```

## Конфигурация

Создайте файл `.env` на основе `.env.example`:

## API Endpoints

### Auth
- GET /api/auth/{provider} - OAuth redirect
- GET /api/auth/{provider}/callback - OAuth callback
- POST /api/auth/refresh - Refresh token
- POST /api/auth/logout - Logout
- GET /api/auth/me - Get current user

### Cards (Protected)
- GET /api/cards - Get user's cards
- POST /api/cards - Create card
- PUT /api/cards/:id - Update card
- DELETE /api/cards/:id - Delete card

### Links (Protected)
- POST /api/links - Create short link
- GET /api/links - Get user's links
- DELETE /api/links/:id - Delete link

## Frontend Repository

Frontend: https://github.com/addavriance/linkoo
