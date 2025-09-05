# ✅ Чек-лист деплоя на Vercel

## 🎯 ШАГ 1: База данных (5 минут)

### Supabase (РЕКОМЕНДУЕТСЯ):
1. ☐ Откройте https://supabase.com
2. ☐ Создайте аккаунт через GitHub
3. ☐ New Project: 
   - Name: `bonus-system`
   - Password: `придумайте надежный пароль`
   - Region: `выберите ближайший к России`
4. ☐ Дождитесь создания (2-3 минуты)
5. ☐ Settings > Database > Connection string
6. ☐ Скопируйте PostgreSQL URI

## 🎯 ШАГ 2: Environment Variables в Vercel

### Откройте Vercel Dashboard:
1. ☐ https://vercel.com/dashboard
2. ☐ Проект: `next-shadcn-dashboard-starter`
3. ☐ Settings > Environment Variables

### Добавьте переменные:

#### ОБЯЗАТЕЛЬНЫЕ:
```
DATABASE_URL
Значение: postgresql://postgres:[ваш-пароль]@[хост]:[порт]/postgres
```

```
NEXT_PUBLIC_APP_URL  
Значение: https://next-shadcn-dashboard-starter-5e080foql-mixas-projects-21d26952.vercel.app
```

```
CRON_SECRET
Значение: bonus-system-cron-secret-2025-production
```

#### ОПЦИОНАЛЬНЫЕ (можно добавить позже):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_SENTRY_DSN
```

## 🎯 ШАГ 3: Перезапуск деплоя

После добавления переменных:
1. ☐ Deployments > Redeploy последний деплой
2. ☐ Дождитесь успешного завершения
3. ☐ Проверьте что сайт открывается

## 🎯 ШАГ 4: Настройка базы данных

После успешного деплоя:
```bash
# Загрузить production env
vercel env pull .env.production

# Применить миграции
yarn prisma migrate deploy

# Создать первый проект
yarn tsx scripts/simple-test.ts
```

## 🎯 ШАГ 5: Webhook для Tilda

После завершения деплоя ваш webhook URL будет:
```
https://next-shadcn-dashboard-starter-5e080foql-mixas-projects-21d26952.vercel.app/api/webhook/[webhook-secret]
```

webhook-secret найдете в админке проекта после создания.

## 🚨 ЧАСТЫЕ ПРОБЛЕМЫ:

### Ошибка "Database connection failed":
- ☐ Проверьте DATABASE_URL в Vercel
- ☐ Убедитесь что база доступна из интернета
- ☐ Правильный ли пароль в строке подключения

### Ошибка "Module not found":
- ☐ Очистите Vercel cache: Settings > Functions > Clear Cache
- ☐ Перезапустите деплой

### Clerk ошибки:
- ☐ Можно временно работать без Clerk (keyless mode)
- ☐ Добавьте домен в Clerk Dashboard если используете

## ✅ ГОТОВО!

После выполнения всех шагов у вас будет:
- ✅ Рабочий SaaS на Vercel
- ✅ PostgreSQL база на Supabase  
- ✅ Готовый webhook для Tilda
- ✅ Telegram боты (настроите токены позже)

URL для Tilda webhook:
`https://your-vercel-url.vercel.app/api/webhook/your-webhook-secret`
