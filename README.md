# Linkoo Backend API

RESTful API для платформы цифровых визиток Linkoo.

## 🚀 Особенности

- **OAuth 2.0**: Google, VK, Discord, GitHub
- **JWT Authentication**: Access & Refresh tokens
- **MongoDB**: База данных
- **TypeScript**: Полная типизация
- **Express**: Web framework + Zod validation

## 📦 Установка

```bash
npm install
```

## ⚙️ Конфигурация

Создайте файл `.env` на основе `.env.example`:

```env
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/linkoo
JWT_SECRET=your-secret-key-at-least-32-characters-long

# OAuth Credentials (получите на сайтах провайдеров)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
VK_CLIENT_ID=...
VK_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

## 🏃 Запуск

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📚 API Endpoints

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

## 🔗 Frontend Repository

Frontend: https://github.com/addavriance/linkoo
