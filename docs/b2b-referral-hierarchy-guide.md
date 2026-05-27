# 🏢 B2B Реферальная иерархия — полный гайд

> **Статус:** ✅ Релиз 2026-05-24  
> **Применимость:** опт-ин per project через `Project.enablePartnerRoles`  
> **Совместимость:** обратная — старые c2c-проекты продолжают работать без изменений  
> **Связанные документы:** [database-schema.md](./database-schema.md), [b2b-referral-readiness.md](./b2b-referral-readiness.md), [changelog.md](./changelog.md)

## 🎯 Содержание

1. [Что такое b2b-иерархия](#что-такое-b2b-иерархия)
2. [Когда использовать](#когда-использовать)
3. [Как включить b2b-режим](#как-включить-b2b-режим)
4. [Как назначить роли пользователям](#как-назначить-роли)
5. [Как создать план комиссий](#как-создать-план-комиссий)
6. [Как назначить план тренерам](#как-назначить-план-тренерам)
7. [Как работает Telegram-бот партнёра](#как-работает-telegram-бот-партнёра)
8. [Hierarchy page — дерево партнёров](#hierarchy-page--дерево-партнёров)
9. [Уведомления](#уведомления)
10. [Opt-out от уведомлений](#opt-out-от-уведомлений)
11. [End-to-end ручной тест](#end-to-end-ручной-тест)
12. [Production rollout](#production-rollout)
13. [Активация для пилотного клиента](#активация-для-пилотного-клиента)
14. [FAQ](#faq)
15. [Архитектура (для разработчиков)](#архитектура)

---

## Что такое b2b-иерархия

В классическом c2c-сценарии любой клиент может пригласить друга и получить с его покупок процент. Для b2b-кейса (производитель продаёт через сеть партнёров) этого мало:

- **Клиенты не должны быть рефералами** — реф-ссылка выдаётся только сотрудникам сети
- **Внутри сети есть несколько уровней** — Директор → Менеджеры → Тренеры
- **Комиссия идёт по цепочке вверх** — с каждой покупки получают и тренер, и его менеджер, и директор
- **Менеджер видит свою команду тренеров**, директор — всю организацию, тренер — только своих клиентов

Расширение реализует это через два новых поля в БД:

| Поле | Где | Назначение |
|---|---|---|
| `Project.enablePartnerRoles` | `projects` | Опт-ин: включает b2b-логику для проекта |
| `User.partnerRole` | `users` | Роль пользователя: `CLIENT / TRAINER / MANAGER / DIRECTOR` |

Когда флаг **выключен** — система ведёт себя точно как раньше. Когда **включён** — `findReferrer` пропускает CLIENT'ов, бот показывает партнёрское меню, начинают работать уведомления о новых членах команды.

---

## Когда использовать

✅ **Подходит:**
- Производитель БАДов через спортклубы (директор клуба → менеджеры → тренеры → клиенты)
- Страховой брокер (агентство → менеджеры → агенты → клиенты)
- Сетевой маркетинг с фиксированной структурой (без бесконечной глубины)
- Любая b2b-сеть с несколькими уровнями партнёрства

❌ **Не подходит:**
- Просто реферальная программа «приведи друга, получи бонус» → используйте обычный c2c-режим
- Многоуровневый MLM с глубиной 5+ → требует юридической экспертизы и кастомизации
- Сценарии с несколькими независимыми клубами в одном проекте → нужна follow-up `Organization` сущность

---

## Как включить b2b-режим

### Способ 1: через UI

1. Откройте `/dashboard/projects/<projectId>/settings`
2. Найдите секцию **«B2B Иерархия»**
3. Включите Switch `Использовать партнёрские роли`
4. Сохраните настройки

После сохранения:
- В таблице пользователей появляется колонка «Роль»
- В диалоге профиля появляется селектор роли + outbound-плана
- В боте начинает работать партнёрское меню (если импортирован шаблон)
- При новой регистрации с реф-ссылкой — отправляются уведомления по дереву предков

### Способ 2: через скрипт

```powershell
npx tsx scripts/migrate-partner-roles.ts --projectId=<id>
```

Скрипт **идемпотентен** — повторный запуск ничего не сломает. Подходит для CI/CD и автоматизации.

---

## Как назначить роли

### Через UI (поштучно)

1. Откройте `/dashboard/projects/<projectId>/users`
2. Кликните на пользователя — откроется диалог профиля
3. В секции **«Партнёрская иерархия»** выберите роль из списка:
   - 🔘 `CLIENT` (серый) — обычный клиент, не может приглашать
   - 🔵 `TRAINER` (синий) — тренер, выдаёт реф-ссылку, комиссия L1
   - 🟣 `MANAGER` (фиолетовый) — менеджер, комиссия L2 от своих тренеров
   - 🟡 `DIRECTOR` (золотой) — руководитель, комиссия L3 от всей команды
4. Если роль ≠ CLIENT — появится селектор outbound-плана. Назначьте план комиссий.
5. Сохраните.

### Массово через скрипт

Для миграции существующего проекта, где у пользователей с реф-ссылками уже стоит `outboundReferralPlanId`:

```powershell
# Включит b2b и проставит TRAINER всем юзерам с outbound-планом и ролью CLIENT
npx tsx scripts/migrate-partner-roles.ts --projectId=<id> --auto-trainers
```

Скрипт **не трогает** уже назначенных `TRAINER / MANAGER / DIRECTOR`. После миграции директоров и менеджеров нужно пометить вручную через UI.

---

## Как создать план комиссий

1. Откройте `/dashboard/projects/<projectId>/referral`
2. Перейдите на вкладку **«Планы %»**
3. Нажмите **«Новый план»**
4. Заполните:
   - **Имя**: например, «Стандартный b2b-план»
   - **Уровни**: 3 уровня (рекомендуется для b2b)
     - L1: 7% (тренер с прямого клиента)
     - L2: 2% (менеджер с клиента тренера)
     - L3: 1% (директор с клиента менеджера)
   - **Max payout depth**: 3 (по умолчанию)
   - **Условия выплаты**: например, через X дней после покупки (если используется)
5. Сохраните план

Опционально пометьте план как **default** для проекта — тогда он будет применяться ко всем тренерам, у которых не назначен персональный outbound-план.

---

## Как назначить план тренерам

### Поштучно

В диалоге профиля пользователя (см. раздел [Как назначить роли](#как-назначить-роли)) рядом с селектором роли есть селектор **«План комиссий (outbound)»**. Выберите нужный план — он будет применяться к клиентам, которых пригласит этот тренер.

### Массово

На вкладке **«Планы %»** в карточке плана нажмите **«Назначить всем тренерам»**. Откроется диалог подтверждения с количеством — план будет применён ко всем пользователям с `partnerRole = TRAINER`.

⚠️ **Важно:** уже зафиксированная комиссия (`ReferralAttribution.locked = true`) **не пересчитывается**. План применяется только к новым приглашениям после изменения.

---

## Как работает Telegram-бот партнёра

### Импорт шаблона

1. Откройте `/dashboard/projects/<projectId>/settings`
2. В секции «B2B Иерархия» нажмите **«Импортировать workflow B2B Партнёр»**
3. Перейдите в `/dashboard/projects/<projectId>/workflow`
4. Активируйте импортированный workflow «🏢 B2B Кабинет партнёра»

Альтернативно — через библиотеку шаблонов на `/dashboard/templates`.

### Адаптивное меню

Главное меню бота показывается при `/start` и адаптируется по `user.partnerRole`:

| Роль | Меню |
|---|---|
| CLIENT | 💰 Баланс · 📜 История · 👥 Реферальная программа · 🎯 Уровень · ❓ Помощь |
| TRAINER | + 🔗 Моя ссылка · 👤 Мои клиенты · 💵 Мои выплаты |
| MANAGER | + 👥 Моя команда (свои тренеры + клиенты) |
| DIRECTOR | + 📊 Сводка по организации (общий оборот, топ-5, разбивка по ролям) |

### Партнёрские action-handlers

| Action | Назначение |
|---|---|
| `partner_team` | Список direct referrals с агрегатами (totalPurchases + комиссия) и пагинацией |
| `partner_subject_stats` | Детали конкретного подопечного с проверкой `canViewSubject` |
| `partner_payouts` | Последние 20 транзакций REFERRAL EARN с именем клиента и уровнем |
| `partner_link` | Реферальная ссылка (только если `canRefer = true`) |
| `partner_org_summary` | DIRECTOR-only сводка |

Реализация: `src/lib/services/workflow/handlers/action-handlers.ts`.

---

## Hierarchy page — дерево партнёров

Админ-страница `/dashboard/projects/<projectId>/referral/hierarchy` (видна только когда `enablePartnerRoles = true`):

- **Дерево с раскрытием уровней** — Директор → Менеджеры → Тренеры → Клиенты
- **Поиск** по имени, email, телефону с автораскрытием родителей и подсветкой
- **Period selector** — Today / 7d / 30d / All time. Пересчитывает комиссию за период
- **CSV-экспорт** — id, name, role, parent_name, registered_at, total_purchases, commission_earned. Файл `hierarchy-<projectId>-<date>.csv`
- **API**: `GET /api/projects/[id]/hierarchy` (JSON) и `GET /api/projects/[id]/hierarchy/export` (CSV)

Под капотом — рекурсивный CTE до глубины 3 (`getDescendantTree` в `ReferralCommissionService`).

---

## Уведомления

### Уведомление о новом члене команды

Когда новый пользователь регистрируется по реф-ссылке партнёра, система отправляет уведомления **всему дереву предков** до глубины `maxPayoutDepth` (по умолчанию 3):

| Уровень | Шаблон |
|---|---|
| L1 (прямой рекрутер) | 🎉 Новый клиент в вашей команде: {имя} |
| L2 | 📈 У вашего тренера новый клиент: {имя} |
| L3+ | 📊 В вашей организации новая регистрация: {имя} |

Сервис: `PartnerNotificationService.notifyAncestorsAboutNewMember`. Вызывается неблокирующим `void`-вызовом из `UserService.createUser` после `syncAttributionForInvitedUser`.

Каналы: Telegram (`botManager.getBot().bot.api.sendMessage`) + MAX (`maxBotManager.sendMessageToUser`) — оба канала отправляют параллельно, ошибки одного не ломают другой.

### Обогащённое уведомление о начислении комиссии

В `sendBonusNotification` для `BonusType.REFERRAL` теперь генерируется текст:

> 💰 Вам начислено {amount} ₽ за покупку клиента {clientName} (уровень {level})

Имя клиента подгружается одним запросом из `bonus.metadata.referredUserId`. Для всех остальных типов бонусов формат не изменился.

---

## Opt-out от уведомлений

Любой пользователь может отключить b2b-уведомления:

```typescript
user.metadata = {
  ...user.metadata,
  notifications: {
    ...user.metadata?.notifications,
    referralEvents: false
  }
};
```

При `referralEvents = false` пользователь пропускается в `notifyAncestorsAboutNewMember` (info-лог `partner-notification opt-out`). Остальные предки уведомления получают.

По умолчанию уведомления **включены** (если ключ отсутствует).

⚠️ Уведомления о начислении REFERRAL-комиссии (`sendBonusNotification`) opt-out пока не поддерживают — комиссия — это денежная операция и пользователь должен видеть её всегда.

---

## End-to-end ручной тест

Чек-лист после деплоя на staging.

### Подготовка

1. Создать тестовый проект через `/dashboard/projects/new`
2. На `/dashboard/projects/<id>/settings` включить **B2B Иерархия**
3. Импортировать workflow «🏢 B2B Кабинет партнёра»
4. Активировать workflow в `/workflow`

### Построение иерархии

5. Создать 4 пользователя через webhook или вручную через `/users → +`:
   - **Director** (без `referredBy`)
   - **Manager** (`referredBy = Director`)
   - **Trainer** (`referredBy = Manager`)
   - **Client** (`referredBy = Trainer`, обычная регистрация по реф-ссылке)
6. В диалоге профиля проставить роли: DIRECTOR / MANAGER / TRAINER / CLIENT
7. Каждый партнёр должен открыть бота через `/start` и привязать `telegramId`

### Создание плана комиссий

8. На вкладке «Планы %» создать план с уровнями:
   - L1: 7%
   - L2: 2%
   - L3: 1%
   - maxPayoutDepth: 3
9. Назначить план Trainer'у как outbound-план

### Симуляция покупки

10. Симулировать покупку клиентом на 5000 ₽ через webhook `/api/webhook/[secret]`:
    ```json
    {
      "action": "purchase",
      "payload": {
        "userId": "<client-id>",
        "amount": 5000,
        "orderId": "test-order-1"
      }
    }
    ```

### Проверка результатов

11. **Начисления** (`/dashboard/projects/<id>/users` → транзакции каждого):
    - Trainer получил **350 ₽** (7% от 5000)
    - Manager получил **100 ₽** (2% от 5000)
    - Director получил **50 ₽** (1% от 5000)
    - Сумма комиссий = `5000 * 0.10 = 500 ₽`
12. **Уведомления в боте**:
    - Все три партнёра получили обогащённое сообщение про комиссию (с именем клиента и уровнем)
13. **Hierarchy page** (`/referral/hierarchy`):
    - Дерево показывает Director → Manager → Trainer → Client
    - У Director totalPurchases команды = 5000 ₽
    - CSV-экспорт корректно содержит все 4 строки с правильным `parent_name`
14. **Бот-команды**:
    - У Director в меню видно «📊 Сводка по организации» (топ-5, разбивка по ролям)
    - У Manager — «👥 Моя команда» (Trainer виден с агрегатами)
    - У Trainer — «👤 Мои клиенты» (Client виден)
    - У Client — обычное меню без партнёрских опций

### Регистрация новой регистрации (тест уведомлений)

15. Сгенерировать партнёрскую реф-ссылку у Trainer через `/start → 🔗 Моя ссылка`
16. Зарегистрировать нового клиента по этой ссылке
17. Проверить три уведомления:
    - Trainer: «🎉 Новый клиент в вашей команде: {имя}»
    - Manager: «📈 У вашего тренера новый клиент: {имя}»
    - Director: «📊 В вашей организации новая регистрация: {имя}»

### Регрессионные проверки

18. На другом проекте без `enablePartnerRoles` повторить покупку — поведение не должно измениться, никаких партнёрских уведомлений быть не должно.
19. Опт-аут: проставить `metadata.notifications.referralEvents = false` менеджеру → следующая регистрация не должна слать ему уведомление, остальным — должна.

---

## Production rollout

### Pre-deploy чеклист

```powershell
# 1. Все проверки (lint + tests + build + tsc)
yarn production:check

# 2. Применить миграцию на prod
npx prisma migrate deploy

# 3. Перегенерировать Prisma Client
npx prisma generate
```

### Smoke-тест после деплоя

1. Открыть существующий c2c-проект (без `enablePartnerRoles`)
2. Проверить что:
   - Колонка «Роль» в users **скрыта**
   - В settings нет ошибок
   - Webhook `/api/webhook/[secret]` принимает регистрации с `utm_ref` и привязывает реферера (как раньше)
   - Существующие реф-цепочки и комиссии работают идентично
3. Проверить логи на отсутствие новых ошибок (`partner-notification`, `referral-commission`)

### Rollback план

Если что-то пошло не так:

```sql
-- Полный откат на уровне проекта
UPDATE projects SET enable_partner_roles = false WHERE id = '<projectId>';
```

Этого достаточно — все проверки ролей перестают работать, поведение возвращается к c2c. Роли в БД остаются, но не применяются.

Полный откат миграции (последняя крайность):
```powershell
npx prisma migrate resolve --rolled-back 20260524_add_partner_role
# + дроп колонок и enum (требует SQL)
```

---

## Активация для пилотного клиента

Пошаговая инструкция запуска b2b на конкретном проекте.

### Шаг 1: миграция данных

```powershell
# На staging — сначала dry-run
npx tsx scripts/migrate-partner-roles.ts --projectId=<id> --auto-trainers --dry-run

# Если всё ок — реально применить
npx tsx scripts/migrate-partner-roles.ts --projectId=<id> --auto-trainers
```

Что произойдёт:
- `enablePartnerRoles = true` для проекта
- Все CLIENT с `outboundReferralPlanId != null` получат `partnerRole = TRAINER`
- Уже назначенные TRAINER/MANAGER/DIRECTOR не будут изменены

### Шаг 2: ручное проставление ролей

После авто-миграции тренеры готовы, но менеджеров и директоров система не знает. Нужно проставить вручную:

1. Откройте `/dashboard/projects/<id>/users`
2. Отфильтруйте по роли = TRAINER → найдите тех, кто должен стать MANAGER
3. В профиле каждого смените роль и сохраните
4. Аналогично для DIRECTOR

### Шаг 3: проверка реф-цепочек

В таблице пользователей убедитесь что у каждого менеджера и тренера есть `referredBy` указывающий на родителя в иерархии. Если нет — проставьте через прямую правку или импорт CSV.

### Шаг 4: импорт workflow и активация бота

1. `/dashboard/projects/<id>/settings` → «Импортировать workflow B2B Партнёр»
2. `/dashboard/projects/<id>/workflow` → активировать импортированный workflow
3. Сделать `/start` от тестового аккаунта тренера и проверить меню

### Шаг 5: передача клиенту

Передайте клиенту:
1. Этот гайд (ссылка на `docs/b2b-referral-hierarchy-guide.md`)
2. Доступ к hierarchy page для контроля
3. Инструкцию по добавлению новых партнёров через UI

---

## FAQ

**Q: Что произойдёт если выключить флаг `enablePartnerRoles`?**

A: Все проверки ролей перестают работать, поведение возвращается к c2c. Роли в БД остаются, но не применяются. Безопасный rollback в один клик через UI/API.

**Q: Можно ли назначить outbound-план CLIENT'у?**

A: Нет, валидация в `ReferralCommissionService.setUserOutboundPlan` запрещает это при включённом `enablePartnerRoles`. Сначала смените роль, потом назначайте план.

**Q: Что с уже выплаченными комиссиями при смене роли пользователя?**

A: Не трогаем. `ReferralAttribution.locked = true` фиксирует план, по которому был приглашён клиент. Будущие приглашения этим тренером пойдут уже по новому плану / роли.

**Q: Как откатить миграцию?**

A: Установите `enablePartnerRoles = false` через UI или PATCH `/api/projects/<id>`. Роли в БД сохраняются, но логика их игнорирует. Полный откат миграции (drop колонок) — крайняя мера, не рекомендуется.

**Q: Можно ли иметь несколько планов комиссий в одном проекте?**

A: Да. Разные тренеры могут иметь разные outbound-планы. Управляется через UI «Планы %» или API `referral-outbound-plan`.

**Q: Что если у клиента 5 уровней иерархии, а не 3?**

A: По умолчанию `maxPayoutDepth = 3`. Слайдер в UI позволяет до 10, но юридически b2b-кейсы дальше 3 уровней попадают в зону MLM-регулирования. Для глубины > 3 — обязательная юридическая консультация.

**Q: Как добавить нового тренера в существующую сеть?**

A: Создайте пользователя через UI (или через webhook), укажите `referredBy = <managerId>`, назначьте `partnerRole = TRAINER` и outbound-план. Менеджер автоматически увидит его в «Моя команда» в боте.

**Q: Партнёр получает уведомления спамом — как отключить?**

A: Установите ему `metadata.notifications.referralEvents = false` через Prisma Studio или API. Уведомления о новых членах команды отключатся, при этом уведомления о начислении комиссии останутся (это денежная операция).

**Q: Несколько клубов в одном проекте — поддерживается?**

A: Не в MVP. Сейчас один проект = одна организация. Для нескольких клубов планируется follow-up — сущность `Organization` с привязкой `User.organizationId`.

**Q: Где посмотреть список всех начислений по партнёру?**

A: В боте: `/start → 💵 Мои выплаты` — последние 20 транзакций. Или через API `GET /api/projects/[id]/users/[userId]/payouts`.

---

## Архитектура

Для разработчиков — где смотреть код.

### Слой данных

| Файл | Что |
|---|---|
| `prisma/schema.prisma` | `enum PartnerRole`, `User.partnerRole`, `Project.enablePartnerRoles` |
| `prisma/migrations/20260524_add_partner_role/migration.sql` | DDL миграции |

### Сервисы

| Файл | Что |
|---|---|
| `src/lib/services/referral-commission.service.ts` | `canViewSubject`, `getViewableSubjects`, `getAncestorChain`, `getDescendantTree` через рекурсивные CTE с fallback |
| `src/lib/services/referral.service.ts` | `findReferrer` (фильтр по роли), `generateReferralLink` (валидация CLIENT) |
| `src/lib/services/partner-notification.service.ts` | `notifyAncestorsAboutNewMember` — рассылка уведомлений по дереву предков |
| `src/lib/services/user.service.ts` | Триггер уведомлений в `createUser` после `syncAttributionForInvitedUser` |
| `src/lib/services/workflow/user-variables.service.ts` | Партнёрские переменные (`user.partnerRole`, `user.canRefer`, `user.directReferralsCount`, …) |
| `src/lib/services/workflow/handlers/action-handlers.ts` | `PartnerTeamHandler`, `PartnerSubjectStatsHandler`, `PartnerPayoutsHandler`, `PartnerLinkHandler`, `PartnerOrgSummaryHandler` |
| `src/lib/telegram/notifications.ts` | `sendBonusNotification` с обогащённой веткой для `BonusType.REFERRAL` |

### Workflow

| Файл | Что |
|---|---|
| `src/lib/workflow-templates/b2b-partner-cabinet.json` | JSON-шаблон workflow «B2B Кабинет партнёра» |
| `src/lib/services/bot-templates.service.ts` | Регистрация шаблона в библиотеке |

### API

| Endpoint | Назначение |
|---|---|
| `PATCH /api/projects/[id]` | Включить/выключить `enablePartnerRoles` |
| `PATCH /api/projects/[id]/users/[userId]` | Сменить `partnerRole` |
| `PATCH /api/projects/[id]/users/[userId]/referral-outbound-plan` | Назначить outbound-план |
| `GET /api/projects/[id]/users?role=TRAINER,MANAGER` | Фильтр по ролям |
| `GET /api/projects/[id]/users/[userId]/team` | Direct + indirect referrals для бота |
| `GET /api/projects/[id]/users/[userId]/team/[subjectUserId]` | Детали подопечного с проверкой `canViewSubject` |
| `GET /api/projects/[id]/users/[userId]/payouts` | История REFERRAL EARN |
| `GET /api/projects/[id]/hierarchy` | Дерево всех партнёров |
| `GET /api/projects/[id]/hierarchy/export` | CSV экспорт |
| `GET /api/projects/[id]/referral-insights/[subjectUserId]?viewerUserId=...` | Stats с проверкой доступа |

### UI

| Страница / компонент | Что |
|---|---|
| `/dashboard/projects/[id]/users/page.tsx` | Колонка «Роль», фильтр, селекторы в диалоге профиля |
| `/dashboard/projects/[id]/referral/hierarchy/page.tsx` | Дерево с поиском, period selector, CSV-экспорт |
| `/dashboard/projects/[id]/settings` | Switch «B2B Иерархия» + кнопка импорта workflow |
| `referral-commission-plans-panel.tsx` | Searchable user combobox, bulk-assign, slider maxPayoutDepth 1..3 |

### Скрипты

| Файл | Что |
|---|---|
| `scripts/migrate-partner-roles.ts` | Активация b2b + auto-trainers (идемпотентно) |

### Тесты

- `__tests__/services/referral.service.test.ts` — Phase 1, фильтрация
- `__tests__/services/referral-commission.service.test.ts` — Phase 3, эффективные гранты + property-based
- `__tests__/services/partner-notification.service.test.ts` — Phase 5, уведомления
- `__tests__/services/workflow/partner-actions.test.ts` — Phase 4, action-handlers + integration

---

## 🎉 Готово к работе

После прохождения всего гайда у вас должен работать полноценный b2b-флоу с автоматическими комиссиями, уведомлениями и партнёрским кабинетом в Telegram. Если что-то не работает — смотрите [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) или поднимайте issue.

**Хорошего внедрения! 🚀**
