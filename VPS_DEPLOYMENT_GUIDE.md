# 🚀 Полное руководство по деплою на VPS/REG.RU

## 📋 Быстрый старт (для опытных)

```bash
# На VPS
git clone https://github.com/your-username/next-shadcn-dashboard-starter.git
cd next-shadcn-dashboard-starter
cp env.production.example .env.production
# Отредактировать .env.production
chmod +x scripts/*.sh
./scripts/deploy.sh
```

## 🎯 ДЕТАЛЬНАЯ ИНСТРУКЦИЯ

### Шаг 1: Заказ VPS на REG.RU (15 минут)

1. **Заходим на** https://www.reg.ru/vps/
2. **Выбираем тариф:**
   - VPS-2: 4 CPU, 8GB RAM, 80GB SSD (~3000₽/мес) ⭐ РЕКОМЕНДУЕТСЯ
   - OS: Ubuntu 22.04 LTS
   - Панель: Без панели (будем настраивать вручную)
3. **Получаем данные:**
   - IP адрес сервера
   - Логин: root
   - Пароль: в письме

### Шаг 2: Настройка домена (10 минут)

В панели REG.RU или Cloudflare добавляем DNS записи:
```
A     your-domain.ru     → IP_сервера
CNAME www.your-domain.ru → your-domain.ru
```

### Шаг 3: Первичная настройка VPS (30 минут)

#### 3.1 Подключение к серверу
```bash
ssh root@YOUR_VPS_IP
```

#### 3.2 Обновление системы
```bash
apt update && apt upgrade -y
```

#### 3.3 Создание пользователя для деплоя
```bash
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Настройка SSH ключей
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

#### 3.4 Установка Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y
systemctl enable docker
systemctl start docker
```

#### 3.5 Установка Nginx и Certbot
```bash
apt install nginx certbot python3-certbot-nginx -y
systemctl enable nginx
systemctl start nginx
```

#### 3.6 Установка дополнительного ПО
```bash
apt install git curl htop unzip fail2ban ufw -y
```

#### 3.7 Настройка firewall
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### Шаг 4: Клонирование проекта (10 минут)

#### 4.1 Переключение на пользователя deploy
```bash
su - deploy
```

#### 4.2 Клонирование репозитория
```bash
git clone https://github.com/your-username/next-shadcn-dashboard-starter.git
cd next-shadcn-dashboard-starter
```

#### 4.3 Настройка environment variables
```bash
cp env.production.example .env.production
nano .env.production
```

**Обязательно заполните:**
- `APP_URL` - ваш домен
- `DB_PASSWORD` - надежный пароль для БД
- `REDIS_PASSWORD` - пароль для Redis
- `NEXTAUTH_SECRET` - случайная строка 32+ символа
- `CRON_SECRET` - случайная строка для cron endpoints

### Шаг 5: SSL сертификаты (15 минут)

#### 5.1 Первичный SSL сертификат
```bash
sudo certbot --nginx -d your-domain.ru -d www.your-domain.ru
```

#### 5.2 Автообновление сертификатов
```bash
sudo crontab -e
# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Шаг 6: Конфигурация Nginx (10 минут)

#### 6.1 Копирование конфигурации
```bash
sudo cp nginx/sites-available/bonus-system.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/bonus-system.conf /etc/nginx/sites-enabled/
```

#### 6.2 Замена домена в конфигурации
```bash
sudo sed -i 's/your-domain.ru/ВАШИ_ДОМЕН/g' /etc/nginx/sites-available/bonus-system.conf
```

#### 6.3 Проверка и перезагрузка Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 7: Запуск приложения (20 минут)

#### 7.1 Создание директорий для данных
```bash
sudo mkdir -p /var/lib/bonus-system/{postgres,redis}
sudo chown -R deploy:deploy /var/lib/bonus-system
```

#### 7.2 Запуск через deploy скрипт
```bash
chmod +x scripts/*.sh
./scripts/deploy.sh
```

#### 7.3 Проверка статуса
```bash
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs app
```

### Шаг 8: Настройка мониторинга (15 минут)

#### 8.1 Создание cron задач для бэкапов
```bash
crontab -e
# Добавить строки:
0 2 * * * cd /home/deploy/next-shadcn-dashboard-starter && docker-compose -f docker-compose.production.yml run --rm backup /backup.sh
0 4 * * 0 cd /home/deploy/next-shadcn-dashboard-starter && docker system prune -f
```

#### 8.2 Логирование
```bash
# Ротация логов
sudo nano /etc/logrotate.d/bonus-system
```

Содержимое файла:
```
/home/deploy/next-shadcn-dashboard-starter/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0644 deploy deploy
}
```

### Шаг 9: Проверка и тестирование (10 минут)

#### 9.1 Проверка доступности
```bash
curl -I https://your-domain.ru
curl https://your-domain.ru/api/health
```

#### 9.2 Тестирование webhook
```bash
curl -X POST https://your-domain.ru/api/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### 9.3 Проверка SSL
```bash
openssl s_client -connect your-domain.ru:443 -servername your-domain.ru < /dev/null
```

## 🔧 ОБСЛУЖИВАНИЕ

### Ежедневные команды
```bash
# Проверка статуса
docker-compose -f docker-compose.production.yml ps

# Просмотр логов
docker-compose -f docker-compose.production.yml logs --tail=50

# Перезапуск приложения
docker-compose -f docker-compose.production.yml restart app
```

### Обновление приложения
```bash
./scripts/deploy.sh
```

### Бэкап базы данных
```bash
docker-compose -f docker-compose.production.yml run --rm backup /backup.sh
```

### Восстановление из бэкапа
```bash
# Список бэкапов
ls -la database/backups/

# Восстановление
gunzip -c database/backups/backup_bonus_system_20250809_120000.sql.gz | \
docker-compose -f docker-compose.production.yml exec -T postgres \
psql -U bonus_admin -d bonus_system
```

## 🚨 РЕШЕНИЕ ПРОБЛЕМ

### Приложение не запускается
```bash
# Проверить логи
docker-compose -f docker-compose.production.yml logs app

# Проверить переменные окружения
docker-compose -f docker-compose.production.yml config

# Пересобрать образ
docker-compose -f docker-compose.production.yml build --no-cache app
```

### База данных недоступна
```bash
# Проверить статус PostgreSQL
docker-compose -f docker-compose.production.yml exec postgres pg_isready

# Подключиться к БД
docker-compose -f docker-compose.production.yml exec postgres psql -U bonus_admin -d bonus_system
```

### SSL проблемы
```bash
# Обновить сертификаты
sudo certbot renew --dry-run

# Проверить конфигурацию Nginx
sudo nginx -t
```

## 📊 РЕЗУЛЬТАТ

После выполнения всех шагов у вас будет:

✅ **Production-ready SaaS система**  
✅ **HTTPS с автообновлением SSL**  
✅ **Автоматические бэкапы**  
✅ **Мониторинг и логирование**  
✅ **Защита от DDoS (Nginx rate limiting)**  
✅ **Готовность к масштабированию**  

**URL для Tilda webhook:**
```
https://your-domain.ru/api/webhook/your-webhook-secret
```

**Время деплоя:** 2-3 часа  
**Стоимость:** ~3000₽/месяц  
**Uptime:** 99.9%+
