# 🚀 Environment Variables для Vercel

## КРИТИЧЕСКИ ВАЖНЫЕ (без них проект не запустится):

### 1. DATABASE_URL
```
DATABASE_URL=postgresql://username:password@host:5432/database_name
```
**Где получить:**
- Создайте PostgreSQL базу на [Supabase](https://supabase.com) (бесплатно)
- Или [Neon](https://neon.tech) (бесплатно)
- Или [PlanetScale](https://planetscale.com) (бесплатно)

### 2. NEXT_PUBLIC_APP_URL
```
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```
**Примечание:** Замените на ваш реальный Vercel URL после первого деплоя

### 3. CRON_SECRET
```
CRON_SECRET=your-super-secret-cron-key-here-123456789
```
**Генерация:** Любая длинная случайная строка для защиты cron endpoints

## ОПЦИОНАЛЬНЫЕ (можно пропустить для начала):

### Clerk Authentication (можно работать в keyless режиме):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Sentry Error Tracking (опционально):
```
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_ORG=your-org
NEXT_PUBLIC_SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=sntrys_...
NEXT_PUBLIC_SENTRY_DISABLED=false
```

## 📋 ИНСТРУКЦИЯ ПО НАСТРОЙКЕ:

### Шаг 1: Создайте базу данных
1. Идите на https://supabase.com
2. Создайте новый проект
3. Скопируйте Database URL из Settings > Database

### Шаг 2: Настройте переменные в Vercel
1. Откройте https://vercel.com/dashboard
2. Выберите ваш проект `next-shadcn-dashboard-starter`
3. Settings > Environment Variables
4. Добавьте переменные одну за одной

### Шаг 3: Перезапустите деплой
```bash
vercel --prod
```

## ⚡ БЫСТРЫЙ СТАРТ (минимальная конфигурация):

Для тестирования добавьте только эти 3 переменные:
1. `DATABASE_URL` - от Supabase/Neon
2. `NEXT_PUBLIC_APP_URL` - ваш Vercel URL  
3. `CRON_SECRET` - любая случайная строка

Остальное можно настроить позже!
