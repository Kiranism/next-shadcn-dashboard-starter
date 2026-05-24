# Implementation Plan: B2B Referral Hierarchy

## Overview

Реализация поэтапная: Phase 1–3 фундамент (схема, фильтры, доступы), Phase 4–6 параллельно после 3 (бот, уведомления, UI), Phase 7 финиш (миграция, документация). Общая оценка — **6.5–7.5 рабочих дней**. Каждый этап — самостоятельный коммитабельный кусок: после каждого `npx tsc --noEmit`, `yarn lint`, `yarn build`, `yarn test`, обновление `docs/changelog.md`.

## Tasks

- [x] 1. Phase 1: Schema & Filtering — добавить `PartnerRole`, фильтр в `findReferrer`, тесты
- [x] 1.1. Добавить enum `PartnerRole { CLIENT, TRAINER, MANAGER, DIRECTOR }` в `prisma/schema.prisma`
- [x] 1.2. Добавить `User.partnerRole` (default `CLIENT`, map `partner_role`) и индекс `@@index([projectId, partnerRole])`
- [x] 1.3. Добавить `Project.enablePartnerRoles` (default `false`, map `enable_partner_roles`)
- [x] 1.4. Создать миграцию `prisma/migrations/20260524_add_partner_role/migration.sql`, проверить идемпотентность
- [x] 1.5. Запустить `npx prisma migrate dev` + `npx prisma generate` + `npx tsc --noEmit`
- [x] 1.6. Изменить `ReferralService.findReferrer()` — добавить условие по `enablePartnerRoles`
- [x] 1.7. Изменить `ReferralService.generateReferralLink()` — бросать ошибку если CLIENT
- [x] 1.8. Изменить `ReferralCommissionService.setUserOutboundPlan()` — валидация роли
- [x] 1.9. Логировать предупреждения когда CLIENT попадает как реферер
- [x] 1.10. Тест `__tests__/services/referral.service.test.ts`: `findReferrer` возвращает CLIENT когда `enablePartnerRoles = false`
- [x] 1.11. Тест: `findReferrer` возвращает `null` для CLIENT когда `enablePartnerRoles = true`
- [x] 1.12. Тест: `findReferrer` возвращает TRAINER/MANAGER/DIRECTOR в обоих режимах
- [x] 1.13. Тест: `generateReferralLink` бросает ошибку для CLIENT при включённом флаге
- [x] 1.14. Тест: `setUserOutboundPlan` бросает ошибку при назначении CLIENT'у
- [x] 1.15. Phase 1 verification: `yarn test` зелёный, `yarn lint` без ошибок, обновить changelog
- [x] 2. Phase 2: User Management UI — колонка роли, фильтр, селекторы в диалоге
- [x] 2.1. В таблице `/dashboard/projects/[id]/users` добавить колонку «Роль» с цветным badge (CLIENT серый, TRAINER синий, MANAGER фиолетовый, DIRECTOR золотой)
- [x] 2.2. Скрыть колонку роли когда `enablePartnerRoles = false`
- [x] 2.3. Добавить мульти-фильтр по роли в `users-table-filters.tsx`
- [x] 2.4. В диалоге профиля пользователя добавить `Select` для `partnerRole`
- [x] 2.5. Расширить PATCH `/api/projects/[id]/users/[userId]` поддержкой `partnerRole` (Zod)
- [x] 2.6. В диалоге профиля под `Select` роли добавить `Select` для outbound-плана (видимый только если `partnerRole !== CLIENT`)
- [x] 2.7. Загрузить список планов проекта в диалог профиля
- [x] 2.8. Сохранять outbound-план через PATCH `/api/projects/[id]/users/[userId]/referral-outbound-plan`
- [x] 2.9. Расширить GET `/api/projects/[id]/users` параметром `?role=TRAINER,MANAGER`
- [x] 2.10. Phase 2 verification: ручной тест в dashboard, обновить changelog
- [x] 3. Phase 3: Effective Grants — `canViewSubject` и `getViewableSubjects` через рекурсивные CTE
- [x] 3.1. Реализовать `ReferralCommissionService.getAncestorChain(userId, projectId, depth)` через `db.$queryRaw` с CTE
- [x] 3.2. Реализовать `ReferralCommissionService.getDescendantTree(userId, projectId, depth)` через CTE
- [x] 3.3. Защита от циклов через ограничение depth + fallback на итеративный обход при ошибке
- [x] 3.4. `ReferralCommissionService.canViewSubject(projectId, viewerId, subjectId)` с проверками self / manual grant / ancestor
- [x] 3.5. `ReferralCommissionService.getViewableSubjects(projectId, viewerId)` объединяющий self + потомки + manual grants
- [x] 3.6. Memoization через React `cache` в рамках одного запроса
- [x] 3.7. В GET `/api/projects/[id]/referral-insights/[subjectUserId]` добавить опциональный `viewerUserId` параметр и проверку
- [x] 3.8. Создать GET `/api/projects/[id]/users/[userId]/team` с пагинацией direct/indirect
- [x] 3.9. Создать GET `/api/projects/[id]/users/[userId]/team/[subjectUserId]` с проверкой через `canViewSubject`
- [x] 3.10. Создать GET `/api/projects/[id]/users/[userId]/payouts` для истории комиссий
- [x] 3.11. Property-based тест с fast-check: random tree, проверка что `getViewableSubjects` возвращает правильное число потомков
- [x] 3.12. Тест: `canViewSubject` симметричен только в направлении viewer → subject
- [x] 3.13. Тест: добавление manual grant добавляет subject в `getViewableSubjects`
- [x] 3.14. Phase 3 verification: `yarn test` зелёный, обновить changelog
- [x] 4. Phase 4: Bot Partner Cabinet — переменные, action-handlers, workflow-template
- [x] 4.1. Расширить `UserVariablesService.getUserVariables()` партнёрскими переменными (`user.partnerRole`, `user.canRefer`, `user.directReferralsCount`, `user.indirectReferralsCount`, `user.teamSize`, `user.totalCommissionEarned`, `user.commissionThisMonth` + Formatted)
- [x] 4.2. Кэшировать новые переменные через `WorkflowRuntimeService.getCachedUserVariables` (TTL 30s)
- [x] 4.3. Реализовать action-handler `partner_team` в `action-handlers.ts`: список direct referrals с агрегатами + кнопки пагинации (5 элементов на страницу)
- [x] 4.4. Реализовать `partner_subject_stats`: показать стату конкретного подопечного с проверкой `canViewSubject`
- [x] 4.5. Реализовать `partner_payouts`: история REFERRAL EARN транзакций (последние 20)
- [x] 4.6. Реализовать `partner_link`: реферальная ссылка (только если `user.canRefer = true`)
- [x] 4.7. Реализовать `partner_org_summary`: сводка для DIRECTOR — общий оборот команды, число тренеров, топ-5 по обороту
- [x] 4.8. Зарегистрировать новые action-handlers в `node-handlers-registry.ts`
- [x] 4.9. Создать JSON-шаблон `src/lib/workflow-templates/b2b-partner-cabinet.json` со структурой `start → switch by role → menu_per_role`
- [x] 4.10. Меню для CLIENT/TRAINER/MANAGER/DIRECTOR с прогрессивно расширенным набором кнопок согласно Requirement 6.2
- [x] 4.11. Зарегистрировать шаблон в `bot-templates.service.ts`
- [x] 4.12. Integration test: создать тестовый проект с `enablePartnerRoles = true`, дерево 1 директор → 2 менеджера → 5 тренеров → 20 клиентов
- [x] 4.13. Симулировать клик «Моя команда» от менеджера, проверить что в ответе только его 5 тренеров
- [x] 4.14. Симулировать кросс-проверку: тренер пытается посмотреть стату менеджера → отказ
- [x] 4.15. Phase 4 verification: ручной тест бота, обновить changelog
- [x] 5. Phase 5: Notifications — уведомления о комиссии и новых членах команды
- [x] 5.1. Создать `src/lib/services/partner-notification.service.ts`
- [x] 5.2. Метод `notifyAncestorsAboutNewMember(newUserId, projectId)` — рассылка по цепочке предков с учётом opt-out (`user.metadata.notifications.referralEvents !== false`)
- [x] 5.3. Использовать существующий `sendTelegramMessage` из `notifications.ts`, лог всех попыток
- [x] 5.4. В `UserService.createUser()` после `syncAttributionForInvitedUser` вызвать `notifyAncestorsAboutNewMember` неблокирующе
- [x] 5.5. Запускать уведомления только если `enablePartnerRoles = true`
- [x] 5.6. В `sendBonusNotification` (`telegram/notifications.ts`) расширить текст для `BonusType.REFERRAL`: извлекать имя клиента из `bonus.metadata.referredUserId`, формат «💰 Вам начислено {amount} ₽ за покупку клиента {clientName} (уровень {level})»
- [x] 5.7. Тест: создание новой регистрации в b2b-проекте → 3 уведомления по числу предков
- [x] 5.8. Тест: opt-out пользователя — он не получает уведомление, остальные получают
- [x] 5.9. Тест: проект без флага — никаких уведомлений нет
- [x] 5.10. Phase 5 verification: ручной тест на staging, обновить changelog
- [x] 6. Phase 6: Admin UI Improvements — searchable selector, bulk-assign, hierarchy page
- [x] 6.1. В `referral-commission-plans-panel.tsx` заменить `Input` userId на `Command`-комбобокс с поиском
- [x] 6.2. Debounced search через `/api/projects/[id]/users?search={q}&role=TRAINER,MANAGER,DIRECTOR`
- [x] 6.3. Показывать роль badge рядом с именем + текущий outbound-план
- [x] 6.4. Кнопка «Назначить всем тренерам» с диалогом подтверждения
- [x] 6.5. Слайдер `maxPayoutDepth` 1..3 с подсказкой (вместо 1..10)
- [x] 6.6. Banner «Используются персональные планы» когда `referralPlansEnabled = true` (скрыть legacy `ReferralLevel` editor)
- [x] 6.7. Создать страницу `/dashboard/projects/[id]/referral/hierarchy/page.tsx` (Server Component)
- [x] 6.8. data-access функция `getHierarchyTree(projectId, options)` — рекурсивный CTE до глубины 3
- [x] 6.9. Компонент `HierarchyTree` с раскрытием уровней (расширение `ReferralTree` из `user-referrals-display`)
- [x] 6.10. Period selector (today / 7d / 30d / all) на hierarchy page
- [x] 6.11. Search по name/email/phone с подсветкой и автораскрытием родителей
- [x] 6.12. API GET `/api/projects/[id]/hierarchy` для дерева
- [x] 6.13. API GET `/api/projects/[id]/hierarchy/export` для CSV (id, name, role, parent_name, registered_at, total_purchases, commission_earned)
- [x] 6.14. Кнопка экспорта CSV на странице
- [x] 6.15. В `/dashboard/projects/[id]/settings` добавить секцию «B2B Иерархия» со Switch для `enablePartnerRoles`
- [x] 6.16. Подсказка под Switch с описанием эффекта (ссылка на гайд) + кнопка «Импортировать workflow B2B Партнёр»
- [x] 6.17. Phase 6 verification: ручной обход всех новых страниц, обновить changelog
- [x] 7. Phase 7: Migration & Documentation — скрипт миграции, гайд, steering
- [x] 7.1. Создать `scripts/migrate-partner-roles.ts` с args `--projectId` и `--auto-trainers`
- [x] 7.2. Логика: при `--projectId` установить `enablePartnerRoles = true`; при `--auto-trainers` — `partnerRole = TRAINER` всем пользователям с `outboundReferralPlanId != null`
- [x] 7.3. Идемпотентность: повторный запуск не дублирует и не ломает
- [x] 7.4. Добавить в `package.json`: `"migrate-partner-roles": "tsx scripts/migrate-partner-roles.ts"`
- [x] 7.5. Создать `docs/b2b-referral-hierarchy-guide.md` с разделами: что такое, как включить, как назначить роли, как создать план, как работает бот, FAQ
- [x] 7.6. Добавить ссылку из `docs/README.md` на новый гайд
- [x] 7.7. Записать changelog в `docs/changelog.md` (полное описание фичи)
- [x] 7.8. Обновить `docs/tasktracker.md` (отметить задачу как завершённую)
- [x] 7.9. Обновить `.kiro/steering/quick-reference.md` — добавить B2B как фичу
- [x] 7.10. Обновить `.kiro/steering/bonus-logic.md` — добавить раздел «Партнёрская иерархия»
- [x] 7.11. End-to-end manual test: создать проект → включить флаг → построить дерево директор-менеджер-тренер-клиент → симулировать покупку 5000₽ → проверить начисления (тренер 7%, менеджер 2%, директор 1%) и видимость в боте каждого уровня
- [x] 7.12. Production checklist: `yarn production:check`, `npx prisma migrate deploy`, smoke-тест с `enablePartnerRoles = false` (никаких изменений)
- [x] 7.13. Активация для пилотного клиента: `migrate-partner-roles --projectId=<id> --auto-trainers`, инструкция из гайда

## Notes

**Зависимости между этапами:**
- Phase 2 нуждается в Phase 1 (схема партнёр-ролей)
- Phase 3 нуждается в Phase 1 (поле `enablePartnerRoles` для проверки)
- Phase 4 нуждается в Phase 1 + 3 (роли + `getViewableSubjects`)
- Phase 5 нуждается в Phase 3 (`getAncestorChain` для уведомлений)
- Phase 6 нуждается в Phase 1 (роли в users table) + Phase 3 (hierarchy через CTE)
- Phase 7 нуждается в Phase 1–6

**Параллелизация:** Phase 4, 5, 6 могут идти параллельно после завершения Phase 3, разными разработчиками или последовательно одним.

**Open questions** к клиенту, влияющие на Phase 6.7+ (документация и UI):
1. Один клуб или несколько (нужна ли `Organization`)?
2. Откатывать ли комиссию при возвратах товара?
3. Нужны ли отдельные веб-кабинеты партнёрам помимо Telegram?
4. Комиссия — обычные бонусы или нужен механизм вывода в деньги?
5. Welcome-бонус для новых партнёров — отдельная логика или общая?

Параллельно с Phase 1–5 можно запросить ответы — они не блокируют разработку базовой инфраструктуры.

**Rollback Plan:**
1. На уровне проекта — выключить `enablePartnerRoles = false` через PATCH `/api/projects/[id]`. Все проверки ролей перестают работать, поведение возвращается к c2c-логике
2. На уровне бота — деактивировать workflow «B2B Партнёр», вернуть стандартный workflow
3. На уровне БД — миграция `20260524_add_partner_role` обратима через `npx prisma migrate resolve --rolled-back` + дроп колонок и enum
4. На уровне кода — откатить через `git revert <merge-commit>`

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "description": "Phase 1: schema + filtering. Self-contained foundation",
      "tasks": ["1", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "1.10", "1.11", "1.12", "1.13", "1.14", "1.15"]
    },
    {
      "wave": 2,
      "description": "Phase 2 + 3 in parallel: user UI + effective grants. Both depend only on Phase 1",
      "tasks": ["2", "2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "2.10", "3", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12", "3.13", "3.14"]
    },
    {
      "wave": 3,
      "description": "Phase 4 + 5 + 6 in parallel: bot, notifications, admin UI. All depend on Phase 3",
      "tasks": ["4", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "4.11", "4.12", "4.13", "4.14", "4.15", "5", "5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "6", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9", "6.10", "6.11", "6.12", "6.13", "6.14", "6.15", "6.16", "6.17"]
    },
    {
      "wave": 4,
      "description": "Phase 7: migration script, documentation, steering, production rollout",
      "tasks": ["7", "7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10", "7.11", "7.12", "7.13"]
    }
  ]
}
```
