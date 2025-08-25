# 🚀 Руководство по развертыванию на VPS

## 📋 Требования к VPS

### Минимальные требования:
- **CPU**: 2 vCPU
- **RAM**: 4 GB
- **Диск**: 20 GB SSD
- **ОС**: Ubuntu 22.04 LTS / Debian 11
- **Сеть**: Публичный IP адрес

### Рекомендуемые требования:
- **CPU**: 4 vCPU
- **RAM**: 8 GB
- **Диск**: 40 GB SSD
- **ОС**: Ubuntu 22.04 LTS
- **Сеть**: Публичный IP + домен

### Провайдеры VPS:
- DigitalOcean ($24/месяц)
- Hetzner (€8/месяц)
- Linode ($24/месяц)
- Vultr ($24/месяц)
- Contabo (€8/месяц)

## 🎯 Быстрое развертывание (Docker)

### Шаг 1: Подключение к VPS

```bash
ssh root@your-vps-ip
```

### Шаг 2: Установка Docker

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Проверка
docker --version
docker-compose --version
```

### Шаг 3: Клонирование проекта

```bash
# Установка git
apt install git -y

# Клонирование
cd /opt
git clone https://github.com/your-username/saas-bonus-system.git
cd saas-bonus-system
```

### Шаг 4: Настройка окружения

```bash
# Создание .env.production
cat > .env.production << 'EOF'
# Database
DATABASE_URL="postgresql://bonus_user:STRONG_PASSWORD_HERE@postgres:5432/bonus_system"

# Redis
REDIS_URL="redis://redis:6379"
REDIS_HOST="redis"
REDIS_PORT="6379"

# Clerk (получите production ключи)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"

# Security
CRON_SECRET="$(openssl rand -base64 32)"
JWT_SECRET="$(openssl rand -base64 32)"

# Sentry (опционально)
NEXT_PUBLIC_SENTRY_DSN="https://..."
EOF
```

### Шаг 5: Docker Compose Production

Создайте `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: bonus_user
      POSTGRES_PASSWORD: STRONG_PASSWORD_HERE
      POSTGRES_DB: bonus_system
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bonus_user -d bonus_system"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile.production
    restart: always
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app_network
    volumes:
      - ./public:/app/public:ro
      - ./prisma:/app/prisma:ro

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - certbot_data:/var/www/certbot
    depends_on:
      - app
    networks:
      - app_network

volumes:
  postgres_data:
  redis_data:
  certbot_data:

networks:
  app_network:
    driver: bridge
```

### Шаг 6: Dockerfile для production

Создайте `Dockerfile.production`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json pnpm-lock.yaml ./

# Установка pnpm
RUN npm install -g pnpm

# Установка зависимостей
RUN pnpm install --frozen-lockfile

# Копируем исходный код
COPY . .

# Генерация Prisma Client
RUN pnpm prisma:generate

# Build приложения
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Установка pnpm
RUN npm install -g pnpm

# Копируем только необходимое
COPY --from=builder /app/package*.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Создание пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Шаг 7: Nginx конфигурация

Создайте `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        client_max_body_size 10M;

        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /_next/static {
            proxy_pass http://nextjs;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }

        location /api {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Шаг 8: SSL сертификат (Let's Encrypt)

```bash
# Установка Certbot
apt install certbot python3-certbot-nginx -y

# Получение сертификата
certbot --nginx -d your-domain.com -d www.your-domain.com

# Автоматическое обновление
crontab -e
# Добавьте строку:
0 0 * * * certbot renew --quiet
```

### Шаг 9: Запуск приложения

```bash
# Сборка и запуск
docker-compose -f docker-compose.production.yml up -d --build

# Применение миграций
docker-compose -f docker-compose.production.yml exec app pnpm prisma:migrate

# Проверка логов
docker-compose -f docker-compose.production.yml logs -f

# Проверка статуса
docker-compose -f docker-compose.production.yml ps
```

## 📝 Ручное развертывание (без Docker)

### Шаг 1: Подготовка системы

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка необходимых пакетов
apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx
```

### Шаг 2: Установка Node.js

```bash
# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установка pnpm
npm install -g pnpm pm2

# Проверка
node --version
pnpm --version
```

### Шаг 3: Установка PostgreSQL

```bash
# Установка PostgreSQL
apt install -y postgresql postgresql-contrib

# Настройка
sudo -u postgres psql << EOF
CREATE DATABASE bonus_system;
CREATE USER bonus_user WITH PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE bonus_system TO bonus_user;
EOF

# Настройка доступа
nano /etc/postgresql/14/main/postgresql.conf
# listen_addresses = 'localhost'

systemctl restart postgresql
```

### Шаг 4: Установка Redis

```bash
# Установка Redis
apt install -y redis-server

# Настройка
nano /etc/redis/redis.conf
# supervised systemd
# maxmemory 256mb
# maxmemory-policy allkeys-lru

systemctl restart redis-server
systemctl enable redis-server
```

### Шаг 5: Настройка приложения

```bash
# Создание пользователя
useradd -m -s /bin/bash nodeapp
su - nodeapp

# Клонирование проекта
cd /home/nodeapp
git clone https://github.com/your-username/saas-bonus-system.git
cd saas-bonus-system

# Установка зависимостей
pnpm install

# Настройка окружения
cp env.example.txt .env.production
nano .env.production
# Настройте все переменные

# Сборка
pnpm build

# Миграции
pnpm prisma:migrate
```

### Шаг 6: PM2 конфигурация

Создайте `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'saas-bonus-system',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Запуск через PM2:

```bash
# Запуск
pm2 start ecosystem.config.js

# Сохранение конфигурации
pm2 save
pm2 startup systemd -u nodeapp --hp /home/nodeapp
```

### Шаг 7: Nginx настройка

```bash
# Создание конфигурации
nano /etc/nginx/sites-available/saas-bonus-system

# Содержимое:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Активация
ln -s /etc/nginx/sites-available/saas-bonus-system /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 🔒 Настройка безопасности

### 1. Firewall (UFW)

```bash
# Установка и настройка
apt install -y ufw

ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 2. Fail2ban

```bash
# Установка
apt install -y fail2ban

# Конфигурация
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
nano /etc/fail2ban/jail.local

# Включите:
[sshd]
enabled = true
maxretry = 3
bantime = 3600

systemctl restart fail2ban
```

### 3. Автоматические обновления

```bash
# Установка
apt install -y unattended-upgrades

# Настройка
dpkg-reconfigure --priority=low unattended-upgrades
```

## 📊 Мониторинг

### 1. Системный мониторинг

```bash
# Установка htop
apt install -y htop

# Установка netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

### 2. Логирование

```bash
# PM2 логи
pm2 logs

# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL логи
tail -f /var/log/postgresql/postgresql-*.log
```

### 3. Мониторинг приложения

```bash
# PM2 мониторинг
pm2 monit

# Статус сервисов
systemctl status nginx
systemctl status postgresql
systemctl status redis-server
```

## 🔄 Обновление приложения

### С Docker:

```bash
cd /opt/saas-bonus-system
git pull origin main
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
docker-compose -f docker-compose.production.yml exec app pnpm prisma:migrate
```

### Без Docker:

```bash
su - nodeapp
cd ~/saas-bonus-system
git pull origin main
pnpm install
pnpm build
pnpm prisma:migrate
pm2 reload all
```

## 🔧 Backup и восстановление

### Backup базы данных:

```bash
# Создание backup
pg_dump -U bonus_user bonus_system > backup_$(date +%Y%m%d).sql

# Автоматический backup (crontab)
0 2 * * * pg_dump -U bonus_user bonus_system > /backups/db_$(date +\%Y\%m\%d).sql
```

### Восстановление:

```bash
psql -U bonus_user bonus_system < backup_20250128.sql
```

## 🐛 Решение проблем

### Проблема: 502 Bad Gateway

```bash
# Проверка приложения
pm2 status
pm2 logs

# Перезапуск
pm2 restart all
```

### Проблема: Нехватка памяти

```bash
# Добавление swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Проблема: Медленная работа

```bash
# Оптимизация PostgreSQL
nano /etc/postgresql/14/main/postgresql.conf
# shared_buffers = 256MB
# effective_cache_size = 1GB
# work_mem = 4MB

systemctl restart postgresql
```

## 📋 Чек-лист production

- [ ] SSL сертификат настроен
- [ ] Firewall включен
- [ ] Fail2ban настроен
- [ ] Backup настроен
- [ ] Мониторинг работает
- [ ] Логирование настроено
- [ ] Переменные окружения production
- [ ] Clerk production ключи
- [ ] Sentry подключен
- [ ] Redis пароль установлен
- [ ] PostgreSQL пароль сильный
- [ ] Автообновления включены

## 💰 Оптимизация расходов

1. **Используйте CDN** для статики (Cloudflare)
2. **Сжатие изображений** (WebP формат)
3. **Кэширование** на уровне Nginx
4. **Автомасштабирование** при необходимости

## 📞 Поддержка

При проблемах:
1. Проверьте логи: `pm2 logs`, `docker logs`
2. Проверьте статус: `systemctl status`, `docker ps`
3. Создайте issue на GitHub

---

*Последнее обновление: 28.01.2025*
*Версия: 1.2.0*