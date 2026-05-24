# 🎯 SaaS Bonus System - Документация

## 📋 Обзор проекта

**SaaS Bonus System** - это мультитенантная платформа для управления бонусными программами с интеграцией Telegram ботов. Система позволяет создавать проекты для разных клиентов, каждый со своими настройками бонусной программы и Telegram ботом.

## 🏗️ Архитектура

```mermaid
graph TB
    A[Клиент A - Интернет-магазин] --> B[Webhook API]
    AA[Клиент B - Интернет-магазин] --> B
    B --> C[SaaS Bonus System]
    C --> D[PostgreSQL Database]
    C --> E[Telegram Bot A]
    C --> F[Telegram Bot B]
    C --> G[Admin Dashboard]
    E --> H[Пользователи клиента A]
    F --> I[Пользователи клиента B]
```

## 📚 Документация

### 📖 Основная документация:
- [📊 Database Schema](./database-schema.md) - схема базы данных
- [🔗 API Reference](./api.md) - документация API endpoints
- [📞 Webhook Integration](./webhook-integration.md) - гайд по интеграции
- [🏢 B2B Реферальная иерархия](./b2b-referral-hierarchy-guide.md) - партнёрские роли, уведомления, hierarchy page (опт-ин per project)
- [🔧 Tilda Webhook Setup](./tilda-webhook-setup.md) - настройка webhook в Tilda (решение "Invalid JSON")
- [🔧 Troubleshooting](./TROUBLESHOOTING.md) - решение частых проблем
- [🤖 Telegram Bots](./telegram-bots.md) - настройка и работа с ботами
- [📧 Resend Setup](./RESEND_SETUP.md) - настройка email через Resend
- [🚀 Deploy Instructions](./DEPLOY_INSTRUCTIONS.md) - инструкция по деплою на сервер

### 📋 Управление проектом:
- [📝 Changelog](./changelog.md) - история изменений
- [📌 Task Tracker](./tasktracker.md) - трекер задач

### 🧪 Alpha Testing:
- [🚀 Alpha Testing Setup](./ALPHA_TESTING_SETUP.md) - руководство для alpha тестеров

## 🚀 Быстрый старт

### 1. Настройка окружения

```powershell
# Клонируйте репозиторий
git clone <your-repo>
cd saas-bonus-system

# Установите зависимости
yarn install

# Локальные сервисы через Docker (Postgres + Redis)
docker compose up -d

# Установите переменные окружения для текущей сессии PowerShell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5434/saas_bonus_system?schema=public"
$env:REDIS_URL="redis://localhost:6379"
$env:JWT_SECRET="dev_super_secret_change_me"

# Примените миграции и сгенерируйте Prisma Client
npx prisma migrate dev
npx prisma generate
```

### 2. Переменные окружения

Создайте файл `.env` со следующими переменными:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/saas_bonus_system?schema=public

# Redis (если используется)
REDIS_URL=redis://localhost:6379

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:5006
JWT_SECRET=dev_super_secret_change_me



# Email провайдер - Resend (https://resend.com)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### 📧 Настройка Email через Resend

Для работы подтверждения email требуется настройка [Resend](https://resend.com) - сервиса для отправки транзакционных писем:

1. **Зарегистрируйтесь на Resend**: Перейдите на [https://resend.com](https://resend.com) и создайте аккаунт
2. **Верифицируйте домен** (рекомендуется для production):
   - В Dashboard перейдите в "Domains"
   - Добавьте ваш домен и настройте DNS записи
   - Дождитесь верификации (обычно 5-10 минут)
3. **Получите API ключ**:
   - Перейдите в "API Keys" в левом меню
   - Нажмите "Create API Key"
   - Выберите уровень доступа (`sending_access` достаточно)
   - Скопируйте ключ (он отображается только один раз!)
4. **Настройте переменные окружения**:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
   > ⚠️ Для локальной разработки можно использовать `noreply@resend.dev` без верификации домена

**Важно:** Без настроенного `RESEND_API_KEY` система будет работать в режиме заглушки - письма будут логироваться, но не отправляться реально.

### 3. Запуск приложения

```powershell
# Development режим (порт 5006)
yarn dev

# Приложение будет доступно на http://localhost:5006

# (Опционально) Проверка системы
yarn exec ts-node scripts/system-check.ts
```

## 🎯 Основные возможности

### 🏢 Мультитенантность
- Каждый клиент получает свой проект с уникальными настройками
- Изоляция данных между проектами
- Индивидуальные webhook endpoints

### 💰 Бонусная система
- Гибкие правила начисления (процент с покупки, фиксированная сумма)
- Настраиваемый срок истечения бонусов
- История всех операций
- Автоматическое списание по принципу FIFO

### 🤖 Telegram интеграция
- Отдельный бот для каждого проекта
- Привязка аккаунтов по телефону или email
- Проверка баланса и истории операций
- Настраиваемые сообщения

### 🔗 Webhook API
- Универсальный endpoint для интеграции
- Поддержка регистрации пользователей
- Начисление бонусов за покупки
- Списание бонусов при оплате

## 🛠️ Технологический стек

| Компонент | Технология |
|-----------|------------|
| Framework | Next.js 15 + React 19 |
| Database | PostgreSQL + Prisma |
| UI | Shadcn/ui + Tailwind CSS v4 |
| Auth | JWT |
| Telegram | Grammy |
| Language | TypeScript |
| Styling | HeroUI + Tailwind |

## 📦 Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   └── webhook/       # Webhook handlers
│   ├── dashboard/         # Admin dashboard
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── layout/           # Layout components
├── features/             # Feature-based modules
│   ├── projects/         # Project management
│   ├── users/            # User management
│   └── bonuses/          # Bonus system
├── lib/                  # Core utilities
│   ├── services/         # Business logic
│   ├── telegram/         # Telegram bot logic
│   └── db.ts            # Database connection
├── types/               # TypeScript types
└── hooks/               # Custom React hooks

docs/                    # Documentation
prisma/                  # Database schema
```

## 🔄 Основные процессы

### 1. Регистрация пользователя
```
Сайт клиента → Webhook API → Создание User → Уведомление
```

### 2. Начисление бонусов
```
Покупка → Webhook API → Расчет бонусов → Создание Bonus → Transaction
```

### 3. Списание бонусов
```
Оплата бонусами → Webhook API → Проверка баланса → Списание → Transaction
```

### 4. Telegram взаимодействие
```
/start → Привязка аккаунта → /balance → /history
```

## 🧪 Тестирование

```powershell
# Проверка типов TypeScript
npx tsc --noEmit

# Валидация Prisma схемы
npx prisma validate

# Сборка проекта
yarn build

# Линтинг
yarn lint
```

## 📞 Поддержка

При возникновении вопросов или проблем:
1. Проверьте [Task Tracker](./tasktracker.md) на известные проблемы
2. Ознакомьтесь с [Changelog](./changelog.md) для последних изменений
3. Создайте issue в системе управления проектом

---

**Версия документации**: 1.0  
**Последнее обновление**: 2024-12-31  
**Статус проекта**: 🚧 В разработке 
