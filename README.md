# 🎯 SaaS Bonus System

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-green)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Мультитенантная SaaS платформа для управления бонусными программами с интеграцией Telegram ботов и webhook API для внешних систем.

## 🚀 Возможности

### Основной функционал
- ✅ **Мультитенантность** - изолированные проекты для каждого клиента
- ✅ **Управление бонусами** - начисление, списание, истечение срока
- ✅ **Telegram боты** - уникальный бот для каждого проекта
- ✅ **Webhook API** - интеграция с Tilda, интернет-магазинами
- ✅ **Реферальная программа** - многоуровневая система поощрений
- ✅ **Уровни лояльности** - автоматическое повышение уровня
- ✅ **Аналитика** - детальная статистика и отчеты с кэшированием
- ✅ **Безопасность** - JWT токены, Redis rate limiting, валидация данных
- ✅ **Асинхронная обработка** - Bull очереди для webhook и уведомлений
- ✅ **Высокая производительность** - Redis кэш, оптимизированные SQL запросы

### Технические особенности
- 🔒 Полная типизация TypeScript
- 🧪 Покрытие тестами (Jest + React Testing Library)
- 📝 OpenAPI документация
- 🚦 Rate limiting для API
- 🛡️ Защита от SQL инъекций
- 📊 Мониторинг через Sentry
- 🐳 Docker поддержка

## 📋 Требования

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.2
- yarn >= 4.0.0
- Telegram Bot Token (для каждого проекта)

## 🛠️ Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-org/saas-bonus-system.git
cd saas-bonus-system
```

### 2. Установка зависимостей

```bash
yarn install
```

### 3. Настройка окружения

Создайте файл `.env.local` на основе `env.example.txt`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bonus_system"

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your-password # Если используется пароль

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Application
NEXT_PUBLIC_APP_URL=http://localhost:5006
NODE_ENV=development

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_ORG=your-org
NEXT_PUBLIC_SENTRY_PROJECT=your-project

# Cron Jobs
CRON_SECRET=your-cron-secret

# Bull Queue Settings (optional)
BULL_REDIS_HOST=localhost
BULL_REDIS_PORT=6379
# BULL_REDIS_PASSWORD=your-password
```

### 4. Настройка базы данных

```bash
# Создание миграций
npx prisma migrate dev

# Генерация Prisma Client
npx prisma generate

# (Опционально) Заполнение тестовыми данными
npx prisma db seed
```

### 5. Запуск Redis

```bash
# Через Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Или через docker-compose
docker-compose up -d redis
```

### 6. Запуск приложения

```bash
# Development режим
yarn dev

# Production сборка
yarn build
yarn start
```

Приложение будет доступно по адресу: http://localhost:5006

## 🏗️ Архитектура

```
saas-bonus-system/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API endpoints
│   │   │   ├── webhook/     # Webhook обработчики
│   │   │   ├── projects/    # CRUD проектов
│   │   │   └── telegram/    # Telegram интеграция
│   │   └── dashboard/       # UI страницы
│   ├── components/          # React компоненты
│   ├── features/           # Feature-based модули
│   │   ├── bonuses/        # Управление бонусами
│   │   ├── projects/       # Управление проектами
│   │   └── bots/          # Telegram боты
│   ├── lib/               # Утилиты и сервисы
│   │   ├── services/      # Бизнес-логика
│   │   ├── telegram/      # Telegram интеграция
│   │   ├── validation/    # Схемы валидации
│   │   ├── queues/        # Bull очереди
│   │   └── redis.ts       # Redis клиент и кэш
│   └── types/             # TypeScript типы
├── prisma/
│   ├── schema.prisma      # Схема БД
│   └── migrations/        # Миграции
├── __tests__/            # Тесты
│   ├── api/              # API тесты
│   ├── services/         # Сервисы тесты
│   └── components/       # Компоненты тесты
└── docs/                 # Документация
    ├── openapi.yaml      # OpenAPI спецификация
    └── changelog.md      # История изменений
```

## 🔌 API Документация

### Webhook API

Основной endpoint для интеграции с внешними системами:

```
POST /api/webhook/{webhookSecret}
```

#### Регистрация пользователя

```json
{
  "action": "register_user",
  "payload": {
    "email": "user@example.com",
    "phone": "+79001234567",
    "firstName": "Иван",
    "lastName": "Иванов",
    "referralCode": "REF123"
  }
}
```

#### Начисление бонусов за покупку

```json
{
  "action": "purchase",
  "payload": {
    "email": "user@example.com",
    "amount": 5000,
    "orderId": "ORDER-123",
    "description": "Покупка в интернет-магазине"
  }
}
```

#### Списание бонусов

```json
{
  "action": "spend_bonuses",
  "payload": {
    "email": "user@example.com",
    "amount": 500,
    "orderId": "SPEND-456",
    "description": "Оплата бонусами"
  }
}
```

### Интеграция с Tilda

Поддерживается автоматическая обработка webhook от Tilda:

```json
[
  {
    "name": "Иван Иванов",
    "email": "user@example.com",
    "phone": "+79001234567",
    "payment": {
      "amount": "5000",
      "orderid": "TILDA-789",
      "products": [
        {
          "name": "Товар 1",
          "price": 3000,
          "quantity": 1
        }
      ]
    }
  }
]
```

Полная документация API доступна в файле [docs/openapi.yaml](docs/openapi.yaml)

## 🤖 Telegram Боты

Каждый проект может иметь собственного Telegram бота для взаимодействия с пользователями.

### Настройка бота

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен бота
3. Добавьте токен в настройки проекта через админ-панель

### Команды бота

- `/start` - Начало работы и привязка аккаунта
- `/balance` - Проверка баланса бонусов
- `/history` - История операций
- `/referral` - Реферальная ссылка
- `/help` - Справка

## 🧪 Тестирование

### Запуск тестов

```bash
# Все тесты
yarn test

# Тесты с покрытием
yarn test:coverage

# Тесты в watch режиме
yarn test:watch

# Только unit тесты
yarn test:unit

# Только integration тесты
yarn test:integration
```

### Структура тестов

```
__tests__/
├── api/                    # API endpoint тесты
│   ├── webhook.test.ts    # Webhook обработчики
│   └── analytics.test.ts  # Аналитика
├── services/              # Бизнес-логика
│   └── user.service.test.ts
└── components/            # React компоненты
    └── bonus-management.test.tsx
```

## 🚀 Деплой

### Docker

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.production.yml up -d
```

### Vercel

```bash
# Установка Vercel CLI
npm i -g vercel

# Деплой
vercel --prod
```

### VPS/Dedicated Server

Смотрите подробную инструкцию в [VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md)

## 📊 Мониторинг

### Sentry

Для включения мониторинга ошибок через Sentry:

1. Создайте проект на [sentry.io](https://sentry.io)
2. Добавьте переменные окружения:

```env
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_ORG=your-org
NEXT_PUBLIC_SENTRY_PROJECT=your-project
```

### Метрики

Система автоматически собирает следующие метрики:
- Количество активных пользователей
- Объем начисленных/списанных бонусов
- Конверсия реферальной программы
- Производительность API endpoints
- Ошибки и исключения

## 🔒 Безопасность

### Реализованные меры защиты

- ✅ JWT аутентификация через Clerk
- ✅ Rate limiting для API endpoints
- ✅ Валидация всех входящих данных (Zod)
- ✅ Защита от SQL инъекций (Prisma)
- ✅ CORS настройки
- ✅ Security headers (CSP, XSS Protection)
- ✅ Изоляция данных между тенантами

### Рекомендации

1. Регулярно обновляйте зависимости
2. Используйте сильные пароли для БД
3. Храните секреты в переменных окружения
4. Включите 2FA для админ аккаунтов
5. Настройте резервное копирование БД

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта!

### Процесс разработки

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

### Стандарты кода

- Используйте TypeScript строгую типизацию
- Следуйте ESLint правилам
- Пишите тесты для новой функциональности
- Документируйте API изменения
- Обновляйте CHANGELOG.md

## 📝 Лицензия

Распространяется под лицензией MIT. Смотрите [LICENSE](LICENSE) для подробностей.

## 🆘 Поддержка

- 📧 Email: support@saas-bonus.com
- 💬 Telegram: [@saas_bonus_support](https://t.me/saas_bonus_support)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/saas-bonus-system/issues)

## 🙏 Благодарности

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - ORM
- [Clerk](https://clerk.dev/) - Authentication
- [Grammy](https://grammy.dev/) - Telegram bot framework
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vercel](https://vercel.com/) - Hosting platform

---

<div align="center">
  Made with ❤️ by SaaS Bonus Team
</div>