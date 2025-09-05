# 🚀 Быстрый деплой на VPS без домена (по IP)

Это краткое руководство по развертыванию проекта на Ubuntu 24.04 без домена. Приложение будет доступно по IP на 80 порту (пример: `http://89.111.174.71`).

## 0) Предварительно
- VPS с Ubuntu 24.04, доступ по SSH под `root`
- Публичный IP сервера

## 1) Подключение и базовая защита
```bash
ssh root@<SERVER_IP>

apt update && apt upgrade -y
apt install -y ufw fail2ban git curl ca-certificates openssl

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw --force enable

systemctl enable --now fail2ban
```

## 2) Установка Docker
```bash
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin
docker --version && docker compose version
```

## 3) Клонирование репозитория
```bash
cd /opt
git clone https://github.com/MikhailSagalaev/next-shadcn-dashboard-starter saas-bonus-system
cd /opt/saas-bonus-system
```

## 4) Подготовка окружения (.env)
Создайте файл `.env` в корне проекта. Для деплоя без домена используйте IP:
```bash
APP_URL=http://<SERVER_IP>

# PostgreSQL
DB_USER=bonus_admin
DB_PASSWORD=your_secure_password_here
DB_NAME=bonus_system

# Redis
REDIS_PASSWORD=$(openssl rand -base64 24)

# Security
NEXTAUTH_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 32)

# Clerk (временно тестовые/пустые)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dummy
CLERK_SECRET_KEY=sk_test_dummy
```
Убедитесь, что в `docker-compose.production.yml` переменные читаются из `.env` (в репозитории уже настроено):
- `DATABASE_URL: "postgresql://${DB_USER:-bonus_admin}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-bonus_system}"`
- `REDIS_URL: "redis://:${REDIS_PASSWORD}@redis:6379"`
- `NEXT_PUBLIC_APP_URL: "${APP_URL}"`

## 5) Проброс порта 80 (без Nginx)
Создайте `docker-compose.override.yml` рядом с production-файлом:
```yaml
version: "3.8"
services:
  app:
    ports:
      - "80:3000"
```

## 6) Каталоги для данных
```bash
mkdir -p /var/lib/bonus-system/postgres /var/lib/bonus-system/redis
```

## 7) Запуск контейнеров
```bash
docker compose -f docker-compose.production.yml -f docker-compose.override.yml up -d --build postgres redis app
docker compose -f docker-compose.production.yml -f docker-compose.override.yml ps
```
Проверьте, что Postgres healthy, Redis up, App up.

Логи:
```bash
docker compose -f docker-compose.production.yml -f docker-compose.override.yml logs -f app | cat
docker compose -f docker-compose.production.yml -f docker-compose.override.yml logs -f postgres | cat
```

## 8) Миграции Prisma
```bash
docker compose -f docker-compose.production.yml -f docker-compose.override.yml exec app yarn db:generate
docker compose -f docker-compose.production.yml -f docker-compose.override.yml exec app yarn db:migrate
# альтернатива: docker compose -f ... exec app npx prisma migrate deploy
```

## 9) Проверка
- Браузер: `http://<SERVER_IP>`
- Health:
```bash
curl -i http://127.0.0.1:3000/api/health || true
```

## 10) Обновление версии
```bash
cd /opt/saas-bonus-system
git pull
docker compose -f docker-compose.production.yml -f docker-compose.override.yml down
docker compose -f docker-compose.production.yml -f docker-compose.override.yml up -d --build
docker compose -f docker-compose.production.yml -f docker-compose.override.yml exec app yarn db:migrate
```

## 11) Частые проблемы
- 502/timeout: смотрите логи `app` и `postgres`. Проверьте переменные `.env`.
- Миграции не применяются: запустите `yarn db:generate` и затем `yarn db:migrate` в контейнере `app`.
- Порт занят: `netstat -tulpen | grep :80` — освободите порт, перезапустите `docker compose`.

---
Источник проекта: https://github.com/MikhailSagalaev/next-shadcn-dashboard-starter

