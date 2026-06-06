-- Partner team management + join approval queue

CREATE TYPE "PartnerJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "enable_partner_team_management" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "referral_join_requires_approval" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "partner_join_requests" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "referrer_id" TEXT NOT NULL,
  "organization_id" TEXT,
  "status" "PartnerJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "reject_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "partner_join_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "partner_join_requests_project_id_user_id_key"
  ON "partner_join_requests"("project_id", "user_id");

CREATE INDEX IF NOT EXISTS "partner_join_requests_project_id_referrer_id_status_idx"
  ON "partner_join_requests"("project_id", "referrer_id", "status");

CREATE INDEX IF NOT EXISTS "partner_join_requests_project_id_status_idx"
  ON "partner_join_requests"("project_id", "status");
