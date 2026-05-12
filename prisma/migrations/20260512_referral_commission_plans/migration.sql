-- Referral commission plans (per-project + per-influencer) and attribution snapshot

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "referral_plans_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "default_referral_commission_plan_id" TEXT;

CREATE TABLE IF NOT EXISTS "referral_commission_plans" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max_payout_depth" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_commission_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "referral_commission_plans_project_id_idx" ON "referral_commission_plans"("project_id");

ALTER TABLE "referral_commission_plans" ADD CONSTRAINT "referral_commission_plans_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "referral_commission_plan_levels" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_commission_plan_levels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "referral_commission_plan_levels_plan_id_level_key"
  ON "referral_commission_plan_levels"("plan_id", "level");

ALTER TABLE "referral_commission_plan_levels" ADD CONSTRAINT "referral_commission_plan_levels_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "referral_commission_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects" ADD CONSTRAINT "projects_default_referral_commission_plan_id_fkey"
  FOREIGN KEY ("default_referral_commission_plan_id") REFERENCES "referral_commission_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "outbound_referral_plan_id" TEXT;

ALTER TABLE "users" ADD CONSTRAINT "users_outbound_referral_plan_id_fkey"
  FOREIGN KEY ("outbound_referral_plan_id") REFERENCES "referral_commission_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "referral_attributions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "commission_plan_id" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_attributions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "referral_attributions_user_id_key" ON "referral_attributions"("user_id");
CREATE INDEX IF NOT EXISTS "referral_attributions_project_id_idx" ON "referral_attributions"("project_id");
CREATE INDEX IF NOT EXISTS "referral_attributions_referrer_id_idx" ON "referral_attributions"("referrer_id");

ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_commission_plan_id_fkey"
  FOREIGN KEY ("commission_plan_id") REFERENCES "referral_commission_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "referral_stats_grants" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "subject_user_id" TEXT NOT NULL,
    "viewer_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_stats_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "referral_stats_grants_project_id_subject_user_id_viewer_user_id_key"
  ON "referral_stats_grants"("project_id", "subject_user_id", "viewer_user_id");

CREATE INDEX IF NOT EXISTS "referral_stats_grants_project_id_viewer_user_id_idx"
  ON "referral_stats_grants"("project_id", "viewer_user_id");
