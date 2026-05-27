# Requirements Document

## Introduction

Расширение реферальной системы для b2b-кейса «производитель → сеть партнёров». Конкретный заказчик — производитель БАДов, продаёт через спортклубы. Внутри одной организации-партнёра выделено три роли: **Руководитель → Менеджеры → Тренеры/Блогеры**. Реф-ссылки выдаются только тренерам/блогерам и через них приходят клиенты-покупатели. С каждой покупки начисляется комиссия по цепочке вверх (тренер → менеджер → руководитель) согласно зафиксированному плану процентов.

**Бизнес-контекст:**
- Реф-ссылка не публичная, доступна только партнёрам (`TRAINER`, `MANAGER`, `DIRECTOR`)
- Партнёры не входят в админку проекта — взаимодействуют через **Telegram-бота**, как обычные пользователи
- Менеджер должен видеть свою команду тренеров и сводную статистику; руководитель — всю ветку
- При смене процента у партнёра у уже приведённых им рефералов комиссия остаётся прежней (FIFO-атрибуция уже реализована через `ReferralAttribution.locked = true`)

**Архитектура решения:**
- Используем уже существующие модели `ReferralCommissionPlan`, `ReferralAttribution`, `ReferralStatsGrant`, `User.outboundReferralPlanId`
- Добавляем `User.partnerRole` (новый enum)
- Реф-цепочка строится по существующему полю `User.referredBy` (через приглашения)
- Доступ «менеджер видит подчинённых тренеров» вычисляется на лету по `referredBy`-цепочке вверх (без денормализации `ReferralStatsGrant`)
- Личный кабинет партнёра — расширение существующего workflow-template для бота через переменные пользователя

**Scope (MVP):**
- Роли партнёров и фильтрация реф-ссылок
- UI назначения тренерам outbound-плана через селектор пользователей
- Эффективные права доступа «вверх по цепочке» (без ручных грантов)
- Telegram-бот: личный кабинет партнёра с меню по роли
- Уведомления о начислении комиссии
- Дерево иерархии в админ-панели

**Out of scope (вынесено в follow-up):**
- Сущность `Organization` (несколько клубов в одном проекте)
- Отдельный веб-портал `/partner` с логином
- Биллинг/выплаты партнёрам деньгами (только бонусами)
- Откат комиссий при возвратах товара (использовать существующий `TransactionType.RETURN`)

## Glossary

- **Partner** — пользователь с ролью отличной от `CLIENT`. Может выдавать реф-ссылку только если `canRefer = true`
- **Partner_Role** — роль партнёра в иерархии: `CLIENT | TRAINER | MANAGER | DIRECTOR`
- **Referral_Chain** — цепочка приглашений `User.referredBy → referredBy → ...` от приглашённого вверх до корня
- **Effective_Grants** — вычисляемое право viewer'а смотреть статистику subject'а; верно если viewer стоит выше subject в `Referral_Chain` или если есть явный `ReferralStatsGrant`
- **Outbound_Plan** — план комиссий, который применяется к тем, кого пригласил данный партнёр (`User.outboundReferralPlanId`)
- **Inbound_Plan** — план комиссий, по которому приглашали данного юзера; зафиксирован в `ReferralAttribution`
- **Partner_Tree** — поддерево пользователей, у которых данный партнёр стоит где-то выше в `Referral_Chain` (его прямые и косвенные рефералы)
- **Direct_Referrals** — пользователи с `referredBy = userId` (прямые приглашённые)
- **Indirect_Referrals** — все потомки в `Partner_Tree` за исключением `Direct_Referrals`
- **Commission_Earned** — сумма транзакций `type = EARN AND isReferralBonus = true` пользователя

## Requirements

### Requirement 1: Database Schema — Partner Role

**User Story:** Как админ проекта, я хочу разделять пользователей на клиентов и партнёров разных уровней, чтобы реф-ссылки выдавались только нужным людям и логика применялась корректно.

#### Acceptance Criteria

1. THE System SHALL add `PartnerRole` enum to schema with values: `CLIENT`, `TRAINER`, `MANAGER`, `DIRECTOR`

2. THE System SHALL add `User.partnerRole` field:
   - Type: `PartnerRole`
   - Default: `CLIENT`
   - Map: `partner_role`
   - Indexed: `@@index([projectId, partnerRole])`

3. THE System SHALL preserve backward compatibility:
   - Existing users get `CLIENT` by default
   - Migration is non-breaking (no data loss)

4. THE System SHALL provide migration script:
   - Migration name: `20260524_add_partner_role`
   - Idempotent (can be re-run safely)

5. THE Project SHALL allow optional `enablePartnerRoles` flag (project-level feature flag):
   - Type: `Boolean`
   - Default: `false`
   - Map: `enable_partner_roles`
   - WHEN `false`, role-related UI is hidden, all users treated as `CLIENT`

### Requirement 2: Referral Link Restriction

**User Story:** Как владелец системы, я хочу чтобы реф-ссылки работали только у партнёров, чтобы клиенты не могли случайно стать реферерами.

#### Acceptance Criteria

1. THE `ReferralService.findReferrer()` SHALL filter by partner role:
   - WHEN `project.enablePartnerRoles = true`, accept only users with `partnerRole IN (TRAINER, MANAGER, DIRECTOR)`
   - WHEN `project.enablePartnerRoles = false`, behave as before (any active user)

2. WHEN a `CLIENT` user's id is passed as `utm_ref`:
   - The system SHALL return `null` from `findReferrer`
   - The new user SHALL be created without `referredBy` link
   - The system SHALL log a warning with details

3. THE `ReferralCommissionService.setUserOutboundPlan()` SHALL validate partner role:
   - WHEN `enablePartnerRoles = true` AND target user has `partnerRole = CLIENT`, throw error «Outbound план можно назначить только партнёру»

4. THE `ReferralService.generateReferralLink()` SHALL throw error for clients:
   - WHEN target user is `CLIENT` AND `enablePartnerRoles = true`, throw `Error('Реферальная ссылка доступна только партнёрам')`

### Requirement 3: User Management UI — Role Editing

**User Story:** Как админ проекта, я хочу видеть и менять роль каждого пользователя, чтобы выстраивать иерархию партнёров.

#### Acceptance Criteria

1. THE Users table page SHALL display partner role column:
   - Show role badge with color: `CLIENT` (gray), `TRAINER` (blue), `MANAGER` (purple), `DIRECTOR` (gold)
   - Hide column when `enablePartnerRoles = false`

2. THE Users table SHALL provide role filter:
   - Multi-select with role options
   - Combined with existing filters (status, level, etc.)

3. THE User profile dialog SHALL include role selector:
   - Select with all `PartnerRole` values
   - Save via PATCH `/api/projects/[id]/users/[userId]`
   - Show toast on success

4. THE User profile dialog SHALL show outbound plan selector:
   - Visible only when `partnerRole !== CLIENT`
   - List of project's commission plans
   - Save via PATCH `/api/projects/[id]/users/[userId]/referral-outbound-plan`

5. THE Users API SHALL support role filtering:
   - GET `/api/projects/[id]/users?role=TRAINER,MANAGER`
   - Accept comma-separated list

### Requirement 4: Referral Plans Panel — UX Improvements

**User Story:** Как админ проекта, я хочу удобно назначать планы тренерам, чтобы не вписывать UUID руками.

#### Acceptance Criteria

1. THE `ReferralCommissionPlansPanel` SHALL replace text input «User ID» with searchable user selector:
   - Use existing `Command` component
   - Search by firstName, lastName, email, phone (debounce 300ms)
   - Filter results by `partnerRole !== CLIENT` when `enablePartnerRoles = true`
   - Show role badge next to user name

2. THE Panel SHALL show currently assigned plan for selected user:
   - Read `User.outboundReferralPlanId`
   - Highlight in plan list

3. THE Panel SHALL provide bulk-assignment:
   - «Assign to all trainers» button
   - Confirmation dialog with count
   - Apply selected plan to every user with `partnerRole = TRAINER`

4. THE Panel SHALL hide legacy `ReferralLevel` editor:
   - WHEN `referralPlansEnabled = true`, show banner: «Используются персональные планы. Старые уровни не применяются.»
   - Do not delete legacy data

5. THE Panel SHALL limit max depth to 3 by default:
   - Slider 1..10 with default 3 and recommendation note
   - Tooltip explaining что для большинства b2b-кейсов 3 достаточно

### Requirement 5: Effective Grants — Hierarchy Access

**User Story:** Как менеджер партнёра, я хочу автоматически видеть статистику моих тренеров без ручного добавления каждого, чтобы не тратить время администратора.

#### Acceptance Criteria

1. THE System SHALL provide `ReferralCommissionService.canViewSubject(viewerUserId, subjectUserId, projectId)` method:
   - Returns `Promise<boolean>`
   - Returns `true` IF viewer == subject (свою статистику можно)
   - Returns `true` IF viewer стоит в `Referral_Chain` subject'а вверх до корня
   - Returns `true` IF существует `ReferralStatsGrant` (subjectUserId, viewerUserId)
   - Returns `false` otherwise
   - Caches per request (memoize within single API call)

2. THE System SHALL provide `ReferralCommissionService.getViewableSubjects(viewerUserId, projectId)` method:
   - Returns `Promise<string[]>` (subjectUserIds)
   - Includes self
   - Includes all descendants in `Partner_Tree` of viewer
   - Includes all subjects from manual `ReferralStatsGrant` entries
   - Limits depth to project's `referralCommissionPlan.maxPayoutDepth` (default 3) for tree traversal

3. THE `referral-insights/[subjectUserId]` API SHALL accept viewer:
   - WHEN called by admin (project owner), allow always
   - WHEN called by partner (with `viewerUserId` in body or header), check `canViewSubject`
   - Return 403 if access denied

4. THE Bot SHALL use `getViewableSubjects` to populate menu:
   - List of «My team members» = `getViewableSubjects(currentUser.id) - [currentUser.id]`
   - Empty list shows «У вас пока нет подопечных»

5. THE manual `ReferralStatsGrant` SHALL remain available:
   - Use case: дать стороннему наблюдателю (партнёр производителя, бухгалтер) право смотреть, кого он не приглашал

### Requirement 6: Telegram Bot — Partner Cabinet

**User Story:** Как партнёр (тренер/менеджер/руководитель), я хочу через Telegram-бот видеть свою команду, статистику и ссылку, чтобы не нужно было заходить в админку.

#### Acceptance Criteria

1. THE Workflow templates library SHALL include «B2B Партнёр» template:
   - Available via dashboard at `/dashboard/templates`
   - Importable to any project
   - Configurable via `bot-templates` infrastructure

2. THE Bot main menu SHALL adapt by role (computed via `user.partnerRole` variable):
   - WHEN `CLIENT`: «💰 Баланс / 📜 История / 👥 Реферальная программа» (как сейчас)
   - WHEN `TRAINER`: + «🔗 Моя ссылка / 👤 Мои клиенты / 💵 Мои выплаты»
   - WHEN `MANAGER`: + «👥 Моя команда»
   - WHEN `DIRECTOR`: + «📊 Сводка по организации»

3. THE Bot SHALL provide new system variables in `UserVariablesService`:
   - `user.partnerRole` (string)
   - `user.directReferralsCount` (number)
   - `user.indirectReferralsCount` (number)
   - `user.totalCommissionEarned` (string, formatted)
   - `user.commissionThisMonth` (string, formatted)
   - `user.teamSize` (number) — count of users in `Partner_Tree`
   - `user.canRefer` (boolean) — true если `partnerRole !== CLIENT`

4. THE Bot SHALL provide new action handler `partner_team`:
   - Accepts optional `subjectUserId` parameter
   - Lists direct referrals with stats: name, role, totalPurchases, commissionEarned
   - Pagination: 5 items per message with «Показать ещё»
   - Each item is clickable → opens detailed stats of that user

5. THE Bot SHALL provide new action handler `partner_subject_stats`:
   - Accepts `subjectUserId`
   - Calls `canViewSubject(currentUser.id, subjectUserId)`
   - IF allowed, shows: имя, телефон, регистрация, кол-во клиентов под ним, оборот, выплаченная комиссия
   - IF denied, shows «Нет доступа»

6. THE Bot SHALL provide new action handler `partner_payouts`:
   - Lists last 20 transactions where `userId = currentUser.id AND isReferralBonus = true AND type = EARN`
   - Shows: дата, сумма, имя клиента-источника (если доступен), уровень

7. THE Bot menu SHALL hide partner-specific options when `enablePartnerRoles = false`:
   - Use condition node checking project variable

### Requirement 7: Notifications

**User Story:** Как партнёр, я хочу получать уведомления о начислении комиссии и появлении новых подопечных, чтобы быть в курсе и не забывать про систему.

#### Acceptance Criteria

1. THE System SHALL send notification on commission earned:
   - Trigger: `BonusService.awardBonus()` with `bonusType = REFERRAL`
   - Recipient: bonus owner (`bonus.userId`)
   - Channel: Telegram bot (via existing `sendBonusNotification`)
   - Message format: «💰 Вам начислено {amount} ₽ за покупку клиента {clientName} (уровень {level})»
   - Reuse existing notification flow, only adjust text for `REFERRAL` type

2. THE System SHALL send notification on new team member:
   - Trigger: `UserService.createUser()` when new user has `referredBy != null`
   - Recipients: всё дерево предков `referredBy` цепочки до глубины `maxPayoutDepth`
   - Channel: Telegram bot
   - Message format:
     - L1 (direct): «🎉 Новый клиент в вашей команде: {name}»
     - L2+: «📈 У вашего тренера {trainerName} новый клиент: {name}» (для менеджера)
     - Top: «📊 В вашей организации новая регистрация»

3. THE Notifications SHALL respect user's bot status:
   - IF user has no `telegramId`, skip silently
   - IF bot is inactive for project, skip silently
   - Do not block user creation on notification failure

4. THE System SHALL provide opt-out:
   - User metadata key `notifications.referralEvents = false`
   - Skip notification if disabled
   - Default: enabled

### Requirement 8: Hierarchy Tree Visualization (Admin)

**User Story:** Как админ проекта, я хочу видеть иерархию партнёров деревом, чтобы понимать структуру организации и находить проблемные места.

#### Acceptance Criteria

1. THE System SHALL provide hierarchy page:
   - Route: `/dashboard/projects/[id]/referral/hierarchy`
   - Server Component with data-access layer
   - Visible only when `enablePartnerRoles = true`

2. THE Hierarchy page SHALL show tree:
   - Root: project owner / configured root user (если задан) / список всех `DIRECTOR`
   - Levels expandable/collapsible
   - Each node shows: avatar, name, role badge, direct referrals count, total tree size, commission earned (period selector)

3. THE Hierarchy page SHALL provide search:
   - Search by name/email/phone
   - Highlight matching nodes
   - Auto-expand parents to show match

4. THE Hierarchy page SHALL provide period selector:
   - Today / 7 days / 30 days / All time
   - Recompute commission stats per period

5. THE Hierarchy page SHALL allow CSV export:
   - Columns: id, name, role, parent_name, registered_at, total_purchases, commission_earned
   - Filename: `hierarchy-{projectId}-{date}.csv`

6. THE Hierarchy SHALL reuse existing `user-referrals-display` spec components где возможно:
   - Extend `ReferralTree` to show role badges
   - Reuse `ReferralLevelGroup` для группировки

### Requirement 9: Migration & Rollout

**User Story:** Как разработчик, я хочу безопасно раскатить функционал на продакшн без поломки существующих проектов, чтобы старые клиенты продолжали работать.

#### Acceptance Criteria

1. THE Feature flag `Project.enablePartnerRoles` SHALL default to `false`:
   - New behavior is opt-in per project
   - Disabled projects ведут себя как сейчас (без проверок ролей)

2. THE System SHALL provide migration script:
   - File: `scripts/migrate-partner-roles.ts`
   - Accepts `--projectId` arg
   - For specified project: `enablePartnerRoles = true`
   - Optional: `--auto-trainers` — auto-set `partnerRole = TRAINER` для всех юзеров с `outboundReferralPlanId != null`
   - Idempotent (can be re-run)

3. THE Existing `processReferralBonus()` SHALL not change behavior for non-partner-role projects:
   - Logic: WHEN `enablePartnerRoles = false`, treat all `referredBy` as before
   - WHEN `true`, walk chain only via `partnerRole !== CLIENT` (skip clients in chain)

4. THE Tests SHALL cover both modes:
   - Suite for `enablePartnerRoles = false` (legacy behavior preserved)
   - Suite for `enablePartnerRoles = true` (new behavior)

5. THE Documentation SHALL be added:
   - File: `docs/b2b-referral-hierarchy-guide.md`
   - Include: setup steps, role descriptions, FAQ
   - Linked from `docs/README.md`
