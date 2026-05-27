---
inclusion: always
---

# Логика бонусной системы

## Базовые сущности
- `Project` (Tenant) - клиент системы
- `User` - конечный пользователь клиента
- `Bonus` - начисленные бонусы с expiry
- `Transaction` - история операций
- `BotSettings` - настройки Telegram бота

## Режимы начисления бонусов (ВАЖНО)

### Настройка режима
- **`Project.bonusMode`** - режим начисления бонусов
- **Значения**: SIMPLE | LEVELS
- **По умолчанию**: SIMPLE

### Режимы работы

#### SIMPLE (Простой режим)
- Фиксированный процент для всех клиентов
- Процент берется из `Project.bonusPercentage`
- Подходит для простых программ лояльности
- Быстрая настройка за 1 минуту

**Пример:**
```typescript
bonusMode = 'SIMPLE'
bonusPercentage = 5.0
// При покупке на 1000₽ → начисляется 50₽ бонусов
```

#### LEVELS (Уровни бонусов)
- Процент зависит от суммы покупок клиента
- Процент определяется уровнем из таблицы `BonusLevel`
- Мотивирует к большим покупкам
- Требует настройки уровней

**Пример:**
```typescript
bonusMode = 'LEVELS'
// Уровни:
// Базовый (0-10,000₽): 3%
// Серебряный (10,000-50,000₽): 5%
// Золотой (50,000₽+): 7%

// Клиент с totalPurchases = 25,000₽
// → уровень "Серебряный" → 5% бонусов
```

### Логика определения процента

```typescript
function getBonusPercentage(project: Project, user: User): number {
  if (project.bonusMode === 'SIMPLE') {
    return project.bonusPercentage;
  }
  
  if (project.bonusMode === 'LEVELS') {
    const level = findUserLevel(user.totalPurchases, project.bonusLevels);
    return level ? level.bonusPercent : 0;
  }
  
  return 0;
}
```

### Переключение режимов

При переключении режима:
- **SIMPLE → LEVELS**: Уровни активируются, если они были созданы ранее
- **LEVELS → SIMPLE**: Уровни деактивируются, но не удаляются
- Существующие бонусы клиентов не изменяются
- Изменяется только логика начисления новых бонусов

## Время жизни бонусов (ВАЖНО)

### Настройка срока действия
- **`Project.bonusExpiryDays`** - количество дней до истечения бонусов
- **По умолчанию**: 365 дней (1 год)
- **Если `null`**: бонусы не истекают (бессрочные)

### Автоматический расчет
При начислении бонусов система автоматически устанавливает:
```typescript
expiresAt = new Date(Date.now() + bonusExpiryDays * 24 * 60 * 60 * 1000)
```

### Применение
- **Приветственные бонусы**: получают срок действия из `bonusExpiryDays`
- **Бонусы за покупки**: получают срок действия из `bonusExpiryDays`
- **Реферальные бонусы**: получают срок действия из `bonusExpiryDays`
- **Ручные бонусы**: могут иметь кастомный `expiresAt` или использовать настройки проекта

### Проверка истечения
- При расчете доступного баланса **истекшие бонусы исключаются**
- Транзакция типа `EXPIRE` создается при истечении бонусов (если реализовано)

## Типичные флоу
1. **Регистрация**: Webhook → создание User → автоматическое начисление приветственных бонусов (если настроено)
2. **Покупка**: Webhook → начисление Bonus → Transaction
3. **Списание**: Webhook → списание бонусов → Transaction
4. **Telegram**: привязка аккаунта → проверка баланса

## Приветственные бонусы (ВАЖНО)

### Автоматическое начисление
- Начисляются **автоматически** при создании пользователя через webhook
- **Workflow НЕ требуется** - логика встроена в `UserService.createUser`
- Проверка настроек: `welcomeRewardType === 'BONUS'` и `welcomeBonus > 0`

### Приоритет настроек
1. `ReferralProgram.welcomeBonus` (если реферальная программа активна)
2. `Project.welcomeBonus` (базовые настройки проекта)
3. Если оба = 0, приветственные бонусы не начисляются

### Режимы работы
- **WITH_BOT**: бонусы начислены, но доступны после активации в Telegram
- **WITHOUT_BOT**: бонусы начислены и сразу доступны

### Тип бонуса
- `BonusType.WELCOME` - специальный тип для приветственных бонусов
- Создается транзакция типа `EARN` с описанием "Приветственный бонус"

## Логика BonusBehavior (КРИТИЧНО)

Логика зависит от того, использовал ли клиент бонусы при оплате.

| Ситуация | SPEND_AND_EARN | SPEND_ONLY | EARN_ONLY |
|----------|----------------|------------|-----------|
| **Клиент НЕ использовал бонусы** | ✅ Начисляем на **полную сумму** | ✅ Начисляем на **полную сумму** | ✅ Начисляем на **полную сумму** |
| **Клиент использовал бонусы** | ✅ Начисляем на **остаток** (сумма - списанные бонусы) | ❌ **НЕ начисляем** | ⚠️ Невозможно (бонусы нельзя тратить) |

### Примеры:
- Покупка 5000₽, бонусы не использованы → начисляем на 5000₽ (все режимы)
- Покупка 5000₽, списали 1000₽ бонусами:
  - `SPEND_AND_EARN` → начисляем на **4000₽** (остаток)
  - `SPEND_ONLY` → **НЕ начисляем**
  - `EARN_ONLY` → не должно произойти (бонусы нельзя тратить)

## Webhook API дизайн
```json
{
  "action": "register_user|purchase|spend_bonuses",
  "payload": { ... }
}
```

## API endpoints
- `POST /api/webhook/[secret]` - основной webhook
- `GET /api/projects` - список проектов
- `POST /api/projects` - создание проекта
- `GET /api/projects/[id]/stats` - статистика проекта

## Партнёрская иерархия (b2b)

### Опт-ин per project
- **`Project.enablePartnerRoles`** — флаг b2b-режима (default `false`)
- Когда `false` — система ведёт себя как раньше (c2c). Все проверки ролей выключены.
- Когда `true` — включается фильтрация рефереров по роли + уведомления + партнёрский кабинет в боте.
- Опт-ин для отдельного проекта через UI `/dashboard/projects/[id]/settings` или скрипт `scripts/migrate-partner-roles.ts`.

### Роли пользователей
- **`User.partnerRole`** — enum `PartnerRole`:
  - `CLIENT` (default) — обычный клиент, не может приглашать
  - `TRAINER` — тренер, выдаёт реф-ссылку, получает комиссию L1
  - `MANAGER` — менеджер, получает комиссию L2 от своих тренеров
  - `DIRECTOR` — руководитель, получает комиссию L3 от всей команды

### Логика реф-цепочки

Когда `enablePartnerRoles = true`:
- `ReferralService.findReferrer` пропускает CLIENT'ов — даже если CLIENT передан в `utm_ref`, реферер не привязывается, в логах warning.
- `ReferralService.generateReferralLink` бросает ошибку для CLIENT — реф-ссылку могут получить только партнёры.
- Комиссия начисляется по `outboundReferralPlanId` партнёра-приглашающего, если он назначен; иначе — по `defaultReferralCommissionPlan` проекта.
- `maxPayoutDepth` (default `3`) ограничивает глубину выплат — через сколько уровней вверх по `referredBy` идёт комиссия.

### Эффективные права доступа

`ReferralCommissionService.canViewSubject(viewer, subject)` возвращает `true`, если:
- `viewer === subject` (свою стату всегда можно)
- `viewer` — предок `subject` в `referredBy`-цепочке (до `maxPayoutDepth`)
- Существует ручной `ReferralStatsGrant` (subject, viewer)

`getViewableSubjects(viewer)` возвращает `[viewer, ...descendants, ...manualGrants]` — используется в боте для меню «Моя команда».

### Уведомления

`PartnerNotificationService.notifyAncestorsAboutNewMember` рассылает уведомления **всему дереву предков** при новой регистрации (вызывается неблокирующе из `UserService.createUser` после `syncAttributionForInvitedUser`). Шаблоны зависят от уровня:
- L1: «🎉 Новый клиент в вашей команде: {имя}»
- L2: «📈 У вашего тренера новый клиент: {имя}»
- L3+: «📊 В вашей организации новая регистрация: {имя}»

Opt-out: `user.metadata.notifications.referralEvents = false`.

`sendBonusNotification` для `BonusType.REFERRAL` обогащает текст именем клиента-источника и уровнем: «💰 Вам начислено {amount} ₽ за покупку клиента {clientName} (уровень {level})».

### Активация и rollback

```powershell
# Активация для проекта
npx tsx scripts/migrate-partner-roles.ts --projectId=<id> --auto-trainers

# Rollback (поведение возвращается к c2c, роли в БД сохраняются)
# Через UI: settings → Switch B2B → off
# Или PATCH /api/projects/<id> { enablePartnerRoles: false }
```

### Полный гайд
См. [docs/b2b-referral-hierarchy-guide.md](../../docs/b2b-referral-hierarchy-guide.md) — пошаговая инструкция, FAQ, архитектура.
