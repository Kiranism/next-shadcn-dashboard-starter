# Scheduled Triggers — день рождения и периодические сценарии

> **Статус:** ✅ Активно (с 2026-05-27)  
> **Назначение:** запуск workflow по cron-расписанию + фильтру аудитории

## TL;DR

Ноду `trigger.schedule` ставим как точку входа в workflow. Конфигурируем cron + аудиторию + дедупликацию. Каждую минуту cron-эндпоинт `/api/cron/scheduled-triggers` находит подходящие workflow и запускает их для каждого пользователя из аудитории.

## Когда использовать

- Бонус ко дню рождения (аудитория `birthday_today`, дедуп `year`)
- Промо за неделю до ДР (аудитория `birthday_in_days`, `daysBefore=7`, дедуп `year`)
- Еженедельная рассылка остатка бонусов всем активным юзерам (аудитория `all_active_users`, дедуп `week`)
- Reactivation campaign (требует доп. аудиторию `inactive_for_days` — пока не реализовано, см. Roadmap)

## Когда **не** использовать

- Реакция на действие пользователя — берите `trigger.command`, `trigger.message`, `trigger.callback`
- Реакция на webhook от внешнего сервиса — берите `trigger.webhook`
- Один разовый запуск — лучше прямой вызов API, не нужно тратить cron

## Как это работает

```
[Vercel Cron каждую минуту]
        ↓
GET /api/cron/scheduled-triggers (Bearer ${CRON_SECRET})
        ↓
ScheduledTriggerRunner.runDueWorkflows(now)
        ↓
1. db.workflowVersion.findMany(isActive: true)
2. Фильтр: entry-нода = trigger.schedule
3. cronMatches(config.cron, now, config.timezone)?
4. AudienceResolver.resolve(projectId, config.audience)
5. Для каждого userId:
   - dedupe: redis.get(scheduled:wf:v1:user:bucket)?
   - createScheduledContext + processor.resumeWorkflow
   - redis.set(...) с TTL
```

## Конфиг ноды

```ts
interface ScheduleTriggerConfig {
  cron: string;                    // '0 9 * * *' (каждый день в 9:00)
  timezone?: string;               // 'Europe/Moscow' (по умолчанию UTC)
  audience: AudienceConfig;
  dedupeWindow?: 'day' | 'week' | 'month' | 'year' | 'none';
}

interface AudienceConfig {
  type: 'birthday_today' | 'birthday_in_days' | 'birthday_after_days' | 'all_active_users';
  params?: { daysBefore?: number; daysAfter?: number };
}
```

### Cron — поддерживаемое подмножество

| Синтаксис | Пример | Значение |
|-----------|--------|----------|
| `*` | `* * * * *` | каждую минуту |
| Число | `0 9 * * *` | в 9:00 каждый день |
| Список | `0 9,12,18 * * *` | в 9, 12 и 18 часов |
| Диапазон | `0 9 * * 1-5` | по будням в 9:00 |
| Шаг | `*/15 * * * *` | каждые 15 минут |
| Алиас дня | `0 10 * * MON` | по понедельникам в 10:00 |
| Алиас месяца | `0 0 1 JAN *` | 1 января в полночь |

**Не поддерживается** в MVP: `@hourly`, `?`, `L`, `W`, `#`. Если нужно — добавьте в `cron-matcher.ts`.

### Аудитории

| Тип | Описание | Дефолт дедупа |
|-----|----------|---------------|
| `birthday_today` | ДР сегодня (по UTC дню/месяцу из `User.birthDate`) | `year` |
| `birthday_in_days` | ДР через N дней (`params.daysBefore`, 1..365) | `day` |
| `birthday_after_days` | ДР был N дней назад (`params.daysAfter`, 1..365) | `day` |
| `all_active_users` | Все `isActive=true` пользователи проекта | `day` |

Все запросы изолированы по `projectId` (multitenancy). Лимит 5000 юзеров на один запуск.

### Дедупликация

Используется Redis. Ключ: `scheduled:{workflowId}:v{versionNumber}:{userId}:{bucket}`.

Bucket зависит от окна:
- `day` → `2026-05-27`
- `week` → `2026-W22`
- `month` → `2026-05`
- `year` → `2026`
- `none` → нет дедупликации (только если уверены)

При публикации новой версии workflow ключ меняется (через `v{n}`) — дедуп начинается с нуля.

## Запуск разработчиком

### Локально

```powershell
# 1. Поднять Redis (если ещё нет)
docker run -d -p 6379:6379 redis:alpine

# 2. Запустить dev-сервер
yarn dev

# 3. Ручной триггер cron
curl -X POST http://localhost:3000/api/cron/scheduled-triggers `
  -H "Authorization: Bearer $env:CRON_SECRET"
```

### На production (Vercel)

`vercel.json` уже содержит:
```json
{
  "crons": [
    { "path": "/api/cron/scheduled-triggers", "schedule": "* * * * *" }
  ]
}
```

Vercel автоматически добавляет `Authorization: Bearer ${CRON_SECRET}` если переменная установлена в env.

## Пример workflow «Бонус в день рождения»

```
🎂 trigger.schedule
   cron: '0 9 * * *'
   timezone: 'Europe/Moscow'
   audience: { type: 'birthday_today' }
   dedupeWindow: 'year'
        ↓
💰 action.database_query
   query: 'awardBirthdayBonus'
   parameters: ['{{user.id}}', 500]
        ↓
💬 message
   text: '🎂 С Днём Рождения, {{user.firstName}}! Дарим 500 бонусов 🎉'
```

## API

### POST `/api/projects/:id/workflows/audience-preview`

Превью аудитории для редактора. Требует админа проекта.

**Body:**
```json
{
  "type": "birthday_in_days",
  "params": { "daysBefore": 7 }
}
```

**Response:**
```json
{
  "type": "birthday_in_days",
  "total": 12,
  "sampleUserIds": ["user_abc", "user_def", "..."]
}
```

### GET/POST `/api/cron/scheduled-triggers`

Cron-runner. Требует `Authorization: Bearer ${CRON_SECRET}`.

**Response:**
```json
{
  "success": true,
  "durationMs": 234,
  "stats": {
    "workflowsScanned": 8,
    "workflowsMatched": 2,
    "executionsStarted": 12,
    "dedupeSkipped": 1,
    "executionsFailed": 0
  }
}
```

## Roadmap

- [ ] Аудитория `inactive_for_days` (через `lastInteractionAt` или похожий timestamp)
- [ ] Аудитория `has_balance_above` (фильтр по `bonusBalance`)
- [ ] Аудитория `custom_segment` (link на существующий `Segment` модуль)
- [ ] BullMQ-очередь для проектов с >5000 юзеров (батчинг)
- [ ] Аналитика scheduled-runs в админке (последние запуски, успехи/фейлы)
- [ ] Расширение cron-matcher: `@hourly`, `@daily`, `L` (last day of month)

## Связанные документы

- `docs/changelog.md` — запись 2026-05-27
- `.kiro/steering/bonus-logic.md` — логика бонусной системы
- `src/types/workflow.ts` — типы триггеров и конфигов
