-- Один активный план на админа = инвариант.
-- Spec: фикс лимита проектов на платных подписках.
--
-- Идемпотентная миграция:
--   1. Очистить дубли активных подписок: оставить самую щедрую (по
--      max_projects DESC, start_date DESC), остальные перевести в
--      'cancelled' с end_date = NOW().
--   2. Создать partial unique index на (admin_account_id) WHERE
--      status IN ('active', 'trial', 'paused'). После этого вторую
--      активную подписку создать физически невозможно — это даёт
--      гарантию даже если в коде кто-то забудет вызвать единую
--      точку входа BillingService.upsertActiveSubscription.

-- 1. Cleanup: выбираем "лучшую" активную подписку для каждого админа
--    и cancel'им остальные.
WITH ranked AS (
    SELECT
        s.id,
        s.admin_account_id,
        ROW_NUMBER() OVER (
            PARTITION BY s.admin_account_id
            ORDER BY p.max_projects DESC, s.start_date DESC, s.id ASC
        ) AS rn
    FROM "subscriptions" s
    JOIN "subscription_plans" p ON p.id = s.plan_id
    WHERE s.status IN ('active', 'trial', 'paused')
      AND (s.end_date IS NULL OR s.end_date >= NOW())
)
UPDATE "subscriptions" s
SET
    status        = 'cancelled',
    end_date      = COALESCE(s.end_date, NOW()),
    cancelled_at  = COALESCE(s.cancelled_at, NOW()),
    updated_at    = NOW()
FROM ranked r
WHERE s.id = r.id AND r.rn > 1;

-- 2. Гарантия инварианта: только одна активная подписка на админа.
--    Используем CREATE UNIQUE INDEX IF NOT EXISTS (Postgres 9.5+) для
--    идемпотентности — повторное применение миграции не падает.
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_admin_account_id_active_unique"
    ON "subscriptions"("admin_account_id")
    WHERE status IN ('active', 'trial', 'paused');
