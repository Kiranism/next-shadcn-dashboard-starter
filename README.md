# 🎯 Gupil

[![Next.js](https://img.shields.io/badge/Next.js-16.x-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-green)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Gupil - мультитенантная SaaS платформа для управления бонусными программами с интеграцией Telegram ботов и webhook API для внешних систем.

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
- 📊 Мониторинг через Grafana + Loki (self-hosted)
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

Создайте файл `.env` в корне проекта:

```env
# Database (локальные Postgres из Docker слушают на 5434)
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/saas_bonus_system?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# Application
NEXT_PUBLIC_APP_URL=http://localhost:5006
NODE_ENV=development

# Auth (обязательно для /api/auth/*)
JWT_SECRET=dev_super_secret_change_me

# Grafana + Loki (Monitoring - optional)
GRAFANA_URL=http://localhost:3000
GRAFANA_API_KEY=your_grafana_api_key_here
LOKI_URL=http://localhost:3100

# Cron Jobs
CRON_SECRET=your-cron-secret

# Bull Queue Settings (optional)
BULL_REDIS_HOST=localhost
BULL_REDIS_PORT=6379
# BULL_REDIS_PASSWORD=your-password

# Email - Resend (optional, for email verification)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**📧 Настройка Email через Resend:** См. [документацию Resend Setup](./docs/RESEND_SETUP.md) для подробной инструкции по получению API ключа и настройке отправки email.

### 4. Настройка базы данных

```bash
# Создание миграций
npx prisma migrate dev

# Генерация Prisma Client
npx prisma generate

# (Опционально) Заполнение тестовыми данными
npx prisma db seed
```

### 5. Поднять сервисы (Postgres + Redis)

```bash
docker compose up -d
```

### 6. Запуск приложения

```bash
# Development режим (по умолчанию порт 5006)
yarn dev

# Если 5006 занят, укажите свой порт
# yarn dev -p 5007

# Production сборка
yarn build
yarn start
```

Приложение будет доступно по адресу: http://localhost:5006

## ✅ Тестирование

- `yarn test` — запускает конфигурацию Jest с минимальным smoke-тестом `__tests__/sanity.test.js`.  
  Этот прогон проверяет, что окружение и глобальные моки настроены корректно. При необходимости вернуть «тяжёлые» тесты из `__tests__/api|services|workflow|components` уберите ограничения `testMatch` и `moduleNameMapper` в `jest.config.cjs`.

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

### Приветственные бонусы

Система автоматически начисляет приветственные бонусы при регистрации новых пользователей:

- ✅ **Автоматическое начисление** - не требует workflow
- ✅ **Гибкая настройка** - фиксированная сумма или процент скидки
- ✅ **Два режима работы** - с Telegram ботом или без
- ✅ **Приоритет настроек** - реферальная программа > базовые настройки

📚 Подробнее: [Руководство по приветственным бонусам](docs/welcome-bonus-guide.md)

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
docker compose up -d

# Production
docker compose -f docker-compose.production.yml up -d
```

### Vercel

```bash
# Установка Vercel CLI
npm i -g vercel

# Деплой
vercel --prod
```

### VPS/Dedicated Server

Смотрите подробную инструкцию в [docs/VPS_DEPLOYMENT_GUIDE.md](docs/VPS_DEPLOYMENT_GUIDE.md)

## 📊 Мониторинг

### Grafana + Loki

Для включения мониторинга ошибок через Grafana + Loki (self-hosted):

1. Разверните Grafana + Loki через Docker Compose (см. `docs/grafana-loki-setup.md`)
2. Добавьте переменные окружения:

```env
GRAFANA_URL=http://localhost:3000
GRAFANA_API_KEY=your_grafana_api_key_here
LOKI_URL=http://localhost:3100
```

См. [документацию по настройке Grafana + Loki](./docs/grafana-loki-setup.md) для подробных инструкций.

### Метрики

Система автоматически собирает следующие метрики:
- Количество активных пользователей
- Объем начисленных/списанных бонусов
- Конверсия реферальной программы
- Производительность API endpoints
- Ошибки и исключения

## 🔒 Безопасность

### Реализованные меры защиты

- ✅ JWT аутентификация
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

- [Grammy](https://grammy.dev/) - Telegram bot framework
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vercel](https://vercel.com/) - Hosting platform

---

<div align="center">
  Made with ❤️ by SaaS Bonus Team
</div>