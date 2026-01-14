# Linkoo Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)

Backend API для сервиса цифровых визиток и сокращения ссылок.

## Описание

Linkoo — платформа для создания персонализированных цифровых визиток и управления короткими ссылками. API предоставляет функциональность для:

- Создания и управления визитками с кастомными темами
- Сокращения ссылок с аналитикой переходов
- OAuth авторизации через популярные сервисы
- Управления профилями и настройками приватности

## Стек технологий

**Runtime & Framework:**
- Node.js + TypeScript
- Express.js

**База данных:**
- MongoDB + Mongoose

**Авторизация:**
- JWT (Access + Refresh tokens)
- OAuth 2.0 (Google, VK, Discord, GitHub)

**Валидация & Безопасность:**
- Zod для схем валидации
- Helmet для HTTP заголовков
- Rate limiting для защиты от перегрузок
- CORS

**Дополнительно:**
- Compression для оптимизации ответов
- Morgan для логирования
- Nanoid для генерации slug'ов

## Основной функционал

### Визитки
- Создание карточек с контактной информацией
- Поддержка 12+ социальных сетей
- Кастомизация темы и цветовой схемы
- Настройки видимости полей
- Счетчик просмотров

### Короткие ссылки
- Генерация коротких ссылок на внешние URL или карточки
- Аналитика кликов (User-Agent, Referer)
- Кастомные slug'и
- Срок действия ссылок

### Авторизация
- Регистрация/вход по email + пароль
- OAuth через сторонние сервисы
- Refresh token rotation
- Типы аккаунтов (FREE/PRO/PREMIUM)

## Установка и запуск

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env

# Запуск в режиме разработки
npm run dev

# Сборка проекта
npm run build

# Запуск production версии
npm start
```

## Переменные окружения

```env
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/linkoo

JWT_SECRET=your-secret-key-min-32-chars

# OAuth (опционально)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
VK_CLIENT_ID=
VK_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## API Endpoints

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `POST /api/auth/logout` - Выход
- `GET /api/auth/:provider` - OAuth авторизация

### Пользователи
- `GET /api/users/me` - Текущий профиль
- `PUT /api/users/me` - Обновление профиля
- `DELETE /api/users/me` - Удаление аккаунта

### Визитки
- `GET /api/cards` - Список визиток
- `POST /api/cards` - Создание визитки
- `GET /api/cards/:id` - Получение визитки
- `PUT /api/cards/:id` - Обновление визитки
- `DELETE /api/cards/:id` - Удаление визитки

### Ссылки
- `GET /api/links` - Список ссылок
- `POST /api/links` - Создание короткой ссылки
- `GET /api/links/:slug` - Информация о ссылке
- `DELETE /api/links/:slug` - Удаление ссылки
- `GET /:slug` - Редирект по короткой ссылке

## Структура проекта

```
src/
├── config/          # Конфигурация (DB, CORS, ENV)
├── controllers/     # Контроллеры маршрутов
├── middleware/      # Middleware (auth, validation, rate limiting)
├── models/          # Mongoose модели
├── routes/          # Определение маршрутов
├── services/        # Бизнес-логика
├── utils/           # Утилиты и хелперы
├── validators/      # Zod схемы валидации
├── types/           # TypeScript типы
├── app.ts           # Express приложение
└── server.ts        # Точка входа
```

## Модели данных

- **User** - Пользователи с OAuth провайдерами
- **Card** - Цифровые визитки
- **ShortenedLink** - Короткие ссылки
- **RefreshToken** - JWT refresh токены
