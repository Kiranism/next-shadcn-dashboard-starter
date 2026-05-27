# Design Document

## Overview

Расширение существующей реферальной системы под b2b-сценарий «производитель — сеть партнёров». Архитектурно — это слой ролей и навигации поверх уже работающего движка `ReferralCommissionPlan / ReferralAttribution / ReferralStatsGrant`. Без изменения механики выплат: они уже корректны для трёхуровневой иерархии.

Ключевые изменения:
1. Новая ось — `User.partnerRole` (CLIENT/TRAINER/MANAGER/DIRECTOR) и фильтр в `findReferrer`
2. Эффективные права доступа (без денормализации) — функция `canViewSubject` через обход `referredBy`-цепочки
3. Расширение workflow-template для бота: меню по роли + новые системные переменные + новые action-handlers
4. UI-визуализация иерархии в админке (расширение `user-referrals-display` спеки)
5. Уведомления о комиссиях и новых подопечных

## Architecture

### Концепция

```
                   Production-Ready B2B Layer
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   Roles (DB)         Effective Grants       Partner Cabinet
   PartnerRole +      canViewSubject()       Bot template +
   findReferrer       getViewableSubjects    user variables
   filter
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                  Existing Foundation (90%)
              ReferralCommissionPlan +
              ReferralAttribution.locked +
              ReferralStatsGrant +
              processReferralBonus chain walk
```

### Architectural Decisions

#### ADR-1: Role на User vs отдельная таблица

**Решение:** `User.partnerRole` enum, не отдельная таблица `Partner`.

**Обоснование:** партнёр и клиент в нашем кейсе — это один и тот же субъект (User со своим балансом, бонусами, telegramId). Разделение на две сущности вызвало бы двойную регистрацию и сложности с переходом «клиент → начал звать друзей → стал тренером». Enum-поле проще, миграция дешевле, текущие связи (`referredBy`, `Bonus`, `Transaction`) переиспользуются полностью.

**Альтернатива:** отдельная `Partner` таблица + связь 1-1 с `User`. Отбросили — overkill для MVP.

#### ADR-2: Effective Grants on-the-fly vs денормализация

**Решение:** вычисление прав доступа на лету через `canViewSubject()`, без денормализации в `ReferralStatsGrant`.

**Обоснование:** `referredBy`-цепочка уже даёт всю нужную информацию. Денормализация требует синхронизации при каждом изменении роли/реферера и склонна к рассинхронизации. Кэшируем результат в рамках одного запроса (memoization), глобальный кэш не нужен — глубина обхода ограничена 3.

**Альтернатива:** триггер на изменение `User` → пересчёт грантов. Отбросили — лишняя сложность для MVP, будем смотреть на нагрузку.

#### ADR-3: Бот через workflow-template vs новые маршруты `/partner`

**Решение:** Telegram-бот через расширение существующего workflow-template + новые системные переменные и action-handlers. Без отдельного веб-портала.

**Обоснование:** клиент явно сказал — партнёры взаимодействуют как обычные пользователи через бота. Существующая инфраструктура `botFlows / workflows / bot-templates` дотягивается до этого без новой авторизации. Web-портал добавим в follow-up если бизнес взлетит.

**Альтернатива:** отдельный портал `/partner` с OTP-логином. Вынесено в out-of-scope.

#### ADR-4: Рекурсивный обход через CTE vs N запросов

**Решение:** для `getViewableSubjects` использовать рекурсивный CTE (PostgreSQL `WITH RECURSIVE`) — один запрос вместо N обходов.

**Обоснование:** глубина 3 → 1 запрос вместо 4. На дереве в 1000 пользователей это ~1ms vs ~50ms.

**Альтернатива:** итеративный обход через `db.user.findMany` с фильтром `referredBy IN (...)`. Использовать как fallback если CTE даст проблемы (Prisma raw SQL уязвим к опечаткам).

#### ADR-5: Feature flag на уровне проекта

**Решение:** `Project.enablePartnerRoles` — опт-ин per project.

**Обоснование:** не все наши клиенты b2b. Введение жёсткой проверки роли в `findReferrer` сломает существующую c2c-логику где любой клиент может приглашать. Флаг позволяет аккуратно раскатать.

## Components and Interfaces

### Database Changes

```prisma
enum PartnerRole {
  CLIENT    @map("client")
  TRAINER   @map("trainer")
  MANAGER   @map("manager")
  DIRECTOR  @map("director")
}

model Project {
  // ... existing fields
  enablePartnerRoles  Boolean  @default(false)  @map("enable_partner_roles")
}

model User {
  // ... existing fields
  partnerRole  PartnerRole  @default(CLIENT)  @map("partner_role")

  @@index([projectId, partnerRole])
}
```

Миграция: `prisma/migrations/20260524_add_partner_role/migration.sql`

### Service Layer

#### ReferralCommissionService — extensions

```typescript
class ReferralCommissionService {
  // Может ли viewer смотреть статистику subject'а
  static async canViewSubject(
    projectId: string,
    viewerUserId: string,
    subjectUserId: string
  ): Promise<boolean> {
    if (viewerUserId === subjectUserId) return true;

    const grant = await db.referralStatsGrant.findUnique({
      where: {
        projectId_subjectUserId_viewerUserId: {
          projectId, subjectUserId, viewerUserId
        }
      }
    });
    if (grant) return true;

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { defaultReferralCommissionPlan: { select: { maxPayoutDepth: true } } }
    });
    const maxDepth = project?.defaultReferralCommissionPlan?.maxPayoutDepth ?? 3;

    const ancestors = await this.getAncestorChain(subjectUserId, projectId, maxDepth);
    return ancestors.includes(viewerUserId);
  }

  // Подмножество subjectIds, статистику которых может видеть viewer
  static async getViewableSubjects(
    projectId: string,
    viewerUserId: string
  ): Promise<string[]> {
    // self + descendants tree + manual grants
  }

  // Получить цепочку предков по referredBy
  private static async getAncestorChain(
    userId: string, projectId: string, depth: number
  ): Promise<string[]> {
    const result = await db.$queryRaw<Array<{ id: string }>>`
      WITH RECURSIVE ancestors AS (
        SELECT id, referred_by, 1 as depth FROM users
        WHERE id = ${userId} AND project_id = ${projectId}
        UNION ALL
        SELECT u.id, u.referred_by, a.depth + 1
        FROM users u
        JOIN ancestors a ON u.id = a.referred_by
        WHERE a.depth < ${depth} AND u.project_id = ${projectId}
      )
      SELECT id FROM ancestors WHERE id != ${userId};
    `;
    return result.map((r) => r.id);
  }

  // Получить всех потомков в Partner_Tree
  private static async getDescendantTree(
    userId: string, projectId: string, depth: number
  ): Promise<string[]> {
    // Аналогичный CTE но идёт вниз по referredBy
  }
}
```

#### ReferralService — modifications

```typescript
class ReferralService {
  // Добавляем фильтр по partnerRole если включено enablePartnerRoles
  static async findReferrer(
    projectId: string,
    utmRef?: string
  ): Promise<User | null> {
    if (!utmRef) return null;

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { enablePartnerRoles: true }
    });

    const where: Prisma.UserWhereInput = {
      projectId, id: utmRef, isActive: true
    };

    if (project?.enablePartnerRoles) {
      where.partnerRole = { in: ['TRAINER', 'MANAGER', 'DIRECTOR'] };
    }

    const user = await db.user.findFirst({ where });
    if (!user) {
      logger.warn('Referrer not found or has CLIENT role', {
        projectId, utmRef, component: 'referral-service'
      });
      return null;
    }
    return user as User;
  }

  // generateReferralLink — добавляем проверку роли
  static async generateReferralLink(
    userId: string, baseUrl: string,
    additionalParams?: Record<string, string>
  ): Promise<string> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { partnerRole: true, project: { select: { enablePartnerRoles: true } } }
    });

    if (user?.project?.enablePartnerRoles && user.partnerRole === 'CLIENT') {
      throw new Error('Реферальная ссылка доступна только партнёрам');
    }
    // ... остальная существующая логика
  }
}
```

#### UserVariablesService — extensions

Добавляем в `getUserVariables` партнёрские переменные:

- `user.partnerRole` (string)
- `user.canRefer` (boolean)
- `user.directReferralsCount` (number)
- `user.indirectReferralsCount` (number)
- `user.teamSize` (number)
- `user.totalCommissionEarned` (number) + `Formatted`
- `user.commissionThisMonth` (number) + `Formatted`

Источники: `db.user.count` для direct, `getViewableSubjects` для team size, `db.transaction.aggregate` для комиссий.

#### PartnerNotificationService — new

```typescript
// New file: src/lib/services/partner-notification.service.ts
class PartnerNotificationService {
  // Уведомить дерево предков о новом подопечном
  static async notifyAncestorsAboutNewMember(
    newUserId: string, projectId: string
  ): Promise<void> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        enablePartnerRoles: true,
        defaultReferralCommissionPlan: { select: { maxPayoutDepth: true } }
      }
    });
    if (!project?.enablePartnerRoles) return;

    const maxDepth = project.defaultReferralCommissionPlan?.maxPayoutDepth ?? 3;
    const ancestors = await ReferralCommissionService.getAncestorChain(
      newUserId, projectId, maxDepth
    );

    for (let i = 0; i < ancestors.length; i++) {
      const ancestorId = ancestors[i];
      const level = i + 1;
      // Send Telegram notification respecting opt-out
    }
  }
}
```

Триггер: вызывается из `UserService.createUser()` после `syncAttributionForInvitedUser`.

### Workflow Template

Файл: `src/lib/workflow-templates/b2b-partner-cabinet.json`

```
[start] → [load_user_variables]
            │
            ▼
       [switch by user.partnerRole]
       │      │       │       │
       ▼      ▼       ▼       ▼
    CLIENT  TRAINER MANAGER DIRECTOR
       │      │       │       │
       ▼      ▼       ▼       ▼
    [client_menu]  [trainer_menu]  [manager_menu]  [director_menu]
       │              │                │                │
       │              + 🔗 ссылка     + 👥 команда     + 📊 сводка
       │              + 👤 клиенты
       │              + 💵 выплаты
```

Новые action-handlers (добавить в `node-handlers-registry.ts`):

| Action | Назначение |
|---|---|
| `partner_team` | Список direct referrals с агрегатами |
| `partner_subject_stats` | Детали конкретного подопечного |
| `partner_payouts` | История начисленных комиссий |
| `partner_link` | Реферальная ссылка (только если `canRefer = true`) |
| `partner_org_summary` | Сводка по всему `Partner_Tree` (для DIRECTOR) |

### API Layer

#### Existing endpoints to modify

```typescript
// PATCH /api/projects/[id]/users/[userId] — поддержка partnerRole
const PatchUserSchema = z.object({
  partnerRole: z.enum(['CLIENT', 'TRAINER', 'MANAGER', 'DIRECTOR']).optional()
});

// GET /api/projects/[id]/users — фильтр по роли
const role = searchParams.get('role')?.split(',') ?? undefined;

// GET /api/projects/[id]/referral-insights/[subjectUserId] — поддержка viewer проверки
const viewerUserId = request.headers.get('x-viewer-user-id');
if (viewerUserId && viewerUserId !== admin.sub) {
  const allowed = await ReferralCommissionService.canViewSubject(
    projectId, viewerUserId, subjectUserId
  );
  if (!allowed) return 403;
}
```

#### New endpoints

| Endpoint | Метод | Назначение |
|---|---|---|
| `/api/projects/[id]/users/[userId]/team` | GET | Direct + indirect referrals для бота |
| `/api/projects/[id]/users/[userId]/team/[subjectUserId]` | GET | Детали подопечного с проверкой `canViewSubject` |
| `/api/projects/[id]/users/[userId]/payouts` | GET | История REFERRAL транзакций |
| `/api/projects/[id]/hierarchy` | GET | Дерево всех партнёров для admin |
| `/api/projects/[id]/hierarchy/export` | GET | CSV export |

### UI Layer

#### Modified pages

**`/dashboard/projects/[id]/users/page.tsx`** — добавить колонку «Роль» с цветными бейджами, фильтр по роли, селекторы роли и outbound-плана в диалоге профиля.

**`/dashboard/projects/[id]/referral/...`** — расширить `referral-commission-plans-panel.tsx`: заменить input userId на `Command`-комбобокс, добавить bulk-assign для всех тренеров.

#### New page: Hierarchy

**`/dashboard/projects/[id]/referral/hierarchy/page.tsx`** — Server Component:

```
┌──────────────────────────────────────────┐
│  🌳 Иерархия партнёров                   │
├──────────────────────────────────────────┤
│  [🔍 Поиск]  [📅 Период ▾]  [⬇ Export]  │
├──────────────────────────────────────────┤
│  📊 Всего: 234 · Тренеров: 156           │
│      Оборот за 7д: 1.2M ₽                │
├──────────────────────────────────────────┤
│  ▾ 🟡 Иван Директор (DIRECTOR)           │
│       3 менеджера · 156 человек в команде│
│       Комиссия: 24,500 ₽                 │
│    ▾ 🟣 Анна Менеджер (MANAGER)          │
│         12 тренеров · 42 человека        │
│         Комиссия: 8,200 ₽                │
│       ▸ 🔵 Олег Тренер (TRAINER)         │
└──────────────────────────────────────────┘
```

Переиспользует `ReferralTree` из `user-referrals-display`. Новый компонент `HierarchyNode` с расширенными колонками (роль, команда, комиссия).

## Data Models

### Partner Hierarchy Computation

Главная вычисляемая структура — **дерево потомков**. Используем рекурсивный CTE:

```sql
WITH RECURSIVE tree AS (
  SELECT id, referred_by, partner_role, 0 AS depth
  FROM users
  WHERE project_id = $1 AND id = $2

  UNION ALL

  SELECT u.id, u.referred_by, u.partner_role, t.depth + 1
  FROM users u
  INNER JOIN tree t ON u.referred_by = t.id
  WHERE u.project_id = $1 AND t.depth < $3
)
SELECT * FROM tree;
```

Производительность: при дереве 1000 узлов и depth=3 — один запрос за ~5ms.

### Notification Schema

Используем существующую `Notification` таблицу + новый channel:

```typescript
{
  channel: 'telegram',
  metadata: {
    type: 'partner.commission_earned' | 'partner.new_team_member',
    sourceUserId: string,
    amount?: number,
    level?: number
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role filter respects feature flag

*For any* call to `findReferrer` and project where `enablePartnerRoles = false`, the result should be identical to the current behavior (no role-based filtering).

**Validates: Requirements 2.1, 9.3**

### Property 2: Effective grants reflect tree topology

*For any* viewer V and subject S in the same project, `canViewSubject(V, S)` returns true if and only if at least one of: V == S, V is in the `referredBy`-chain ancestors of S up to maxDepth, or a manual `ReferralStatsGrant` exists with subject=S, viewer=V.

**Validates: Requirements 5.1, 5.2**

### Property 3: Notification fan-out matches commission chain

*For any* user U created with referredBy = R, the system shall notify exactly the same set of users that would receive REFERRAL bonus when U makes a purchase, ordered by level ascending.

**Validates: Requirements 7.2**

### Property 4: Partner role transition preserves history

*For any* user U whose `partnerRole` is changed from CLIENT to TRAINER (or vice versa), all existing `Bonus`, `Transaction`, and `ReferralAttribution` records remain unchanged. Future referrals follow the new role rules.

**Validates: Requirements 9.3, 9.4**

### Property 5: Tree size invariant

*For any* user U, `getViewableSubjects(U).length - 1` (minus self) equals the count of users returned by recursive descendant CTE up to maxDepth.

**Validates: Requirements 5.2**

## Error Handling

| Случай | Поведение |
|---|---|
| Циклическая ссылка `referredBy` (data corruption) | CTE с ограничением по depth |
| Пользователь сменил `partnerRole` с TRAINER → CLIENT | Существующие выплаты не трогаем; новые `findReferrer` его исключают |
| `getViewableSubjects` вернул 0 элементов | UI показывает empty state с подсказкой |
| `canViewSubject` для guest-пользователя | Возвращает `false`, бот говорит «Нет доступа» |
| CTE упал (raw SQL ошибка) | Fallback на итеративный обход через Prisma |
| Telegram-уведомление не отправилось | Не блокируем основной поток; повтор через BullMQ |

## Testing Strategy

### Unit Tests

- `ReferralCommissionService.canViewSubject` — все ветки (self, manual grant, ancestor chain, denied)
- `ReferralCommissionService.getViewableSubjects` — древовидные данные, граничные случаи
- `ReferralService.findReferrer` — c фичей и без, разные роли
- `UserVariablesService.getUserVariables` — новые партнёрские переменные
- Новые action-handlers в боте — генерация сообщений и пагинация

### Property-Based Tests (fast-check)

- **Property 1**: `findReferrer` consistency between modes
- **Property 2**: `canViewSubject` correctness on random trees
- **Property 5**: tree size invariant

### Integration Tests

- Полный флоу: register director → invite manager → invite trainer → invite client → client purchases → check notifications + bonuses on every level
- Bot interaction: simulate user typing «Моя команда» → check menu по роли
- Admin UI: open hierarchy page, expand nodes, search, export CSV

### Migration Tests

- Применить миграцию на dump существующего проекта без `enablePartnerRoles` → нет регрессий
- Включить флаг → c2c-проект продолжает работать
- `migrate-partner-roles --auto-trainers` → юзеры с outbound-планом получили TRAINER

## Performance Considerations

| Операция | Оценка | Решение |
|---|---|---|
| `getViewableSubjects` | ~5ms на дерево 1000 узлов | Recursive CTE, индекс на `referred_by` |
| `canViewSubject` | ~2ms | Memoize в рамках запроса |
| `partner_team` action в боте | ~10ms | Pagination (5 на страницу), агрегаты через groupBy |
| Уведомления при регистрации | блокирующий хвост ~30ms на 3 уведомления | Вынести в BullMQ queue |
| Hierarchy page (admin) | ~200ms на 1000 узлов | Server-side, кэширование 60с через unstable_cache |

## Security Considerations

1. **Role escalation**: только админ проекта может менять `partnerRole` (через PATCH `/api/projects/[id]/users/[userId]`)
2. **Cross-project access**: все запросы проверяют `projectId` → не получишь чужих юзеров
3. **Bot-side grant check**: `partner_subject_stats` обязан вызывать `canViewSubject` до показа данных
4. **Manual grant cleanup**: при удалении пользователя удаляем связанные `ReferralStatsGrant` (cascade в Prisma)
5. **CSV export**: проверка прав owner проекта перед генерацией

## Migration Strategy

### Phase 1: Schema (1 час)
- Применить миграцию `20260524_add_partner_role`
- Перегенерировать Prisma Client
- Не активировать фичу-флаг ни на одном проекте

### Phase 2: Code rollout (постепенно)
- Развернуть код с feature flag `enablePartnerRoles = false` по умолчанию
- Проверить что регрессии нет на тестовых проектах
- Smoke-тесты на staging

### Phase 3: Активация для пилотного клиента
- Запустить `scripts/migrate-partner-roles.ts --projectId=<id> --auto-trainers`
- Включить `enablePartnerRoles = true` для проекта
- Установить роли вручную для известных директоров и менеджеров через UI
- Импортировать workflow-template «B2B Партнёр» в бот клиента
- Активировать новый workflow в проекте

### Phase 4: Документация
- Опубликовать `docs/b2b-referral-hierarchy-guide.md`
- Обучающее видео / скриншоты для клиента
- Обновить `docs/changelog.md` и `docs/tasktracker.md`

## Open Questions

Эти вопросы стоит подтвердить с клиентом перед реализацией. Параллельно начинаем этап 1 (роли + фильтр) — он не зависит от ответов.

1. **Один клуб или сеть?** Если несколько независимых клубов в одном проекте → нужна `Organization` сущность. Сейчас предполагаем «один проект = один клуб».
2. **Что с возвратами?** Откатывать комиссию у партнёров при возврате клиента? (использовать существующий `TransactionType.RETURN`)
3. **Личные кабинеты вне Telegram?** В MVP — нет. Если бизнес взлетит, в follow-up добавим `/partner` web-портал.
4. **Выплаты:** комиссия начисляется как обычный `Bonus` (можно потратить в магазине этого же производителя)? Или нужен отдельный механизм вывода?
5. **Welcome бонус для новых партнёров?** Сейчас приветственный бонус начисляется всем; нужно ли отдельное поведение для тренеров/менеджеров?

Ответы на 1–5 повлияют на этап 6 (UI и docs), но не на этапы 1–5 (схема, фильтры, доступы, бот, уведомления).
