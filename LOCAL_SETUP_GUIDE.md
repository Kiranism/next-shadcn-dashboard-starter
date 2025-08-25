# 🚀 Руководство по локальному развертыванию SaaS Bonus System

## 📋 Требования

Перед началом убедитесь, что у вас установлены:

- **Node.js** >= 18.0.0 ([скачать](https://nodejs.org/))
- **pnpm** >= 10.0.0 (`npm install -g pnpm`)
- **PostgreSQL** >= 14 ([скачать](https://www.postgresql.org/download/))
- **Redis** >= 6.2 ([скачать](https://redis.io/download/))
- **Git** ([скачать](https://git-scm.com/))
- **Docker** (опционально, для упрощенной установки)

## 🎯 Быстрый старт (с Docker)

Самый простой способ - использовать Docker Compose:

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/your-username/saas-bonus-system.git
cd saas-bonus-system

# 2. Скопируйте пример окружения
cp env.example.txt .env.local

# 3. Запустите все сервисы
docker-compose up -d

# 4. Установите зависимости
pnpm install

# 5. Примените миграции
pnpm prisma:migrate

# 6. Запустите приложение
pnpm dev
```

Приложение будет доступно по адресу: http://localhost:5006

## 📝 Пошаговая установка (без Docker)

### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/your-username/saas-bonus-system.git
cd saas-bonus-system
```

### Шаг 2: Установка PostgreSQL

#### Windows:
1. Скачайте installer с https://www.postgresql.org/download/windows/
2. Запустите установщик, запомните пароль для пользователя postgres
3. Создайте базу данных:
```powershell
psql -U postgres
CREATE DATABASE bonus_system;
CREATE USER bonus_user WITH PASSWORD 'bonus_password';
GRANT ALL PRIVILEGES ON DATABASE bonus_system TO bonus_user;
\q
```

#### macOS:
```bash
# Установка через Homebrew
brew install postgresql@14
brew services start postgresql@14

# Создание базы данных
psql postgres
CREATE DATABASE bonus_system;
CREATE USER bonus_user WITH PASSWORD 'bonus_password';
GRANT ALL PRIVILEGES ON DATABASE bonus_system TO bonus_user;
\q
```

#### Linux (Ubuntu/Debian):
```bash
# Установка
sudo apt update
sudo apt install postgresql postgresql-contrib

# Настройка
sudo -u postgres psql
CREATE DATABASE bonus_system;
CREATE USER bonus_user WITH PASSWORD 'bonus_password';
GRANT ALL PRIVILEGES ON DATABASE bonus_system TO bonus_user;
\q
```

### Шаг 3: Установка Redis

#### Windows:
1. Скачайте Redis для Windows: https://github.com/microsoftarchive/redis/releases
2. Распакуйте и запустите `redis-server.exe`

Или используйте WSL2:
```bash
wsl --install
# В WSL:
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

#### macOS:
```bash
brew install redis
brew services start redis
```

#### Linux:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Шаг 4: Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```bash
cp env.example.txt .env.local
```

Отредактируйте `.env.local`:

```env
# Database
DATABASE_URL="postgresql://bonus_user:bonus_password@localhost:5432/bonus_system"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Clerk Authentication (получите ключи на https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:5006"
NODE_ENV="development"

# Cron Jobs
CRON_SECRET="your-random-secret-here"
```

### Шаг 5: Получение Clerk ключей

1. Зарегистрируйтесь на https://clerk.com
2. Создайте новое приложение
3. Скопируйте API ключи из Dashboard
4. Вставьте их в `.env.local`

### Шаг 6: Установка зависимостей

```bash
# Установка pnpm если не установлен
npm install -g pnpm

# Установка зависимостей проекта
pnpm install
```

### Шаг 7: Настройка базы данных

```bash
# Генерация Prisma Client
pnpm prisma:generate

# Применение миграций
pnpm prisma:migrate

# (Опционально) Заполнение тестовыми данными
pnpm prisma:seed
```

### Шаг 8: Запуск приложения

```bash
# Development режим с hot reload
pnpm dev

# Или production сборка
pnpm build
pnpm start
```

## 🔍 Проверка работоспособности

### 1. Проверка сервисов

```bash
# PostgreSQL
psql -U bonus_user -d bonus_system -c "SELECT 1"

# Redis
redis-cli ping
# Должен вернуть: PONG

# Приложение
curl http://localhost:5006/api/health
# Должен вернуть: {"status":"ok"}
```

### 2. Проверка через браузер

1. Откройте http://localhost:5006
2. Вы должны увидеть страницу входа Clerk
3. Зарегистрируйтесь или войдите
4. Попадете в Dashboard

## 🐛 Решение частых проблем

### Проблема: "Cannot connect to database"

**Решение:**
```bash
# Проверьте, запущен ли PostgreSQL
sudo systemctl status postgresql

# Проверьте правильность DATABASE_URL
psql "postgresql://bonus_user:bonus_password@localhost:5432/bonus_system"
```

### Проблема: "Redis connection failed"

**Решение:**
```bash
# Проверьте, запущен ли Redis
redis-cli ping

# Если не запущен
sudo systemctl start redis-server
```

### Проблема: "Clerk keys not configured"

**Решение:**
1. Убедитесь, что ключи добавлены в `.env.local`
2. Перезапустите dev сервер после изменения .env

### Проблема: "Port 5006 already in use"

**Решение:**
```bash
# Windows
netstat -ano | findstr :5006
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5006
kill -9 <PID>

# Или измените порт в package.json
"dev": "next dev -p 3000"
```

## 📦 Полезные команды

```bash
# Разработка
pnpm dev              # Запуск в dev режиме
pnpm build           # Production сборка
pnpm start           # Запуск production сборки
pnpm lint            # Проверка кода
pnpm test            # Запуск тестов

# База данных
pnpm prisma:studio   # GUI для просмотра БД
pnpm prisma:migrate  # Применить миграции
pnpm prisma:generate # Генерация Prisma Client
pnpm prisma:seed     # Заполнение тестовыми данными

# Очистка
pnpm clean           # Удаление .next и node_modules
pnpm fresh           # Полная переустановка
```

## 🎯 Следующие шаги

1. **Настройте Telegram бота:**
   - Создайте бота через @BotFather
   - Добавьте токен в настройки проекта

2. **Настройте webhook интеграцию:**
   - Используйте ngrok для локального тестирования
   - `ngrok http 5006`

3. **Изучите документацию:**
   - `/docs/api.md` - API endpoints
   - `/docs/webhook-integration.md` - Webhook интеграция
   - `/docs/telegram-bots.md` - Настройка ботов

## 💡 Советы для разработки

1. **Используйте Prisma Studio** для просмотра и редактирования данных:
   ```bash
   pnpm prisma:studio
   ```

2. **Мониторинг Redis** через Redis Commander:
   ```bash
   npm install -g redis-commander
   redis-commander
   ```

3. **Логирование** - проверяйте логи в консоли разработчика

4. **Hot Reload** - изменения автоматически применяются в dev режиме

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте `/docs/troubleshooting.md`
2. Создайте issue на GitHub
3. Проверьте логи: `pnpm logs`

---

*Последнее обновление: 28.01.2025*
*Версия документации: 1.2.0*