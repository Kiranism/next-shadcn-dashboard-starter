# 🚀 Quick Start Guide

## 🎯 Выберите способ установки:

### Вариант 1: Быстрый старт с Docker (Рекомендуется)
**Время: 5 минут**

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/your-username/saas-bonus-system.git
cd saas-bonus-system

# 2. Запустите базы данных
docker-compose up -d

# 3. Установите зависимости
yarn install

# 4. Настройте окружение
cp env.example.txt .env.local
# Отредактируйте .env.local (см. ниже)

# 5. Примените миграции
yarn prisma:migrate

# 6. Запустите приложение
yarn dev
```

✅ **Готово!** Откройте http://localhost:5006

---

### Вариант 2: Локальная установка без Docker
**Время: 15-20 минут**

```bash
# 1. Установите PostgreSQL и Redis локально
# Windows: скачайте установщики
# macOS: brew install postgresql redis
# Linux: apt install postgresql redis-server

# 2. Клонируйте репозиторий
git clone https://github.com/your-username/saas-bonus-system.git
cd saas-bonus-system

# 3. Установите зависимости
yarn install

# 4. Создайте базу данных
psql -U postgres
CREATE DATABASE bonus_system;
CREATE USER bonus_user WITH PASSWORD 'bonus_password';
GRANT ALL PRIVILEGES ON DATABASE bonus_system TO bonus_user;
\q

# 5. Настройте окружение
cp env.example.txt .env.local
# Отредактируйте .env.local

# 6. Примените миграции
yarn prisma:migrate

# 7. Запустите приложение
yarn dev
```

---

### Вариант 3: Автоматическая установка
**Время: 3 минуты**

```bash
# Используйте наш скрипт установки
chmod +x scripts/deploy.sh
./scripts/deploy.sh local
```

---

## 📝 Минимальная конфигурация .env.local

```env
# База данных (если используете Docker)
DATABASE_URL="postgresql://bonus_user:bonus_password@localhost:5432/bonus_system"

# Redis (если используете Docker)
REDIS_URL="redis://localhost:6379"

# Clerk Auth (можно оставить пустым для keyless mode)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# Остальное - по умолчанию
NEXT_PUBLIC_APP_URL="http://localhost:5006"
NODE_ENV="development"
```

---

## 🎮 Полезные команды

### Разработка
```bash
yarn dev              # Запуск в режиме разработки
yarn build           # Сборка для production
yarn test            # Запуск тестов
yarn lint            # Проверка кода
```

### База данных
```bash
yarn prisma:studio   # GUI для БД (http://localhost:5555)
yarn prisma:migrate  # Применить миграции
yarn prisma:seed     # Заполнить тестовыми данными
```

### Docker
```bash
docker-compose up -d           # Запустить сервисы
docker-compose down            # Остановить сервисы
docker-compose logs -f         # Просмотр логов
docker-compose --profile dev up -d  # С GUI инструментами
```

---

## 🔍 Доступ к инструментам

После запуска доступны:

| Сервис | URL | Описание |
|--------|-----|----------|
| **Приложение** | http://localhost:5006 | Основное приложение |
| **Prisma Studio** | http://localhost:5555 | GUI для базы данных |
| **pgAdmin** | http://localhost:5050 | PostgreSQL GUI (Docker) |
| **Redis Commander** | http://localhost:8081 | Redis GUI (Docker) |

---

## 🐛 Частые проблемы и решения

### Ошибка: "Cannot connect to database"
```bash
# Проверьте, запущен ли PostgreSQL
docker-compose ps
# или
psql -U postgres -c "SELECT 1"
```

### Ошибка: "Port 5006 already in use"
```bash
# Измените порт в package.json
"dev": "next dev -p 3000"
```

### Ошибка: "Clerk keys not configured"
```bash
# Приложение работает в keyless mode
# Или получите ключи на https://clerk.com
```

### Ошибка: "Redis connection failed"
```bash
# Запустите Redis
docker-compose up -d redis
# или
redis-server
```

---

## 📚 Дополнительная документация

- [Полное руководство по локальной установке](./LOCAL_SETUP_GUIDE.md)
- [Руководство по развертыванию на VPS](./VPS_DEPLOYMENT_GUIDE.md)
- [API документация](./docs/openapi.yaml)
- [Архитектура проекта](./docs/project-analysis.md)

---

## 💬 Нужна помощь?

1. Проверьте [Troubleshooting](./docs/troubleshooting.md)
2. Создайте [Issue на GitHub](https://github.com/your-username/saas-bonus-system/issues)
3. Посмотрите логи: `yarn logs` или `docker-compose logs`

---

**Версия:** 1.2.0 | **Обновлено:** 28.01.2025