-- B2B Referral Hierarchy: PartnerRole enum + User.partner_role + Project.enable_partner_roles
-- Spec: .kiro/specs/b2b-referral-hierarchy (Phase 1, Requirement 1)
--
-- Idempotent migration: every CREATE/ALTER uses IF NOT EXISTS or DO-block exception
-- handling, so this file is safe to re-run on databases where the migration was
-- already (partially) applied.

-- 1. Create PartnerRole enum (lowercase values matching Prisma @map directives).
--    Wrapped in DO block because Postgres CREATE TYPE has no IF NOT EXISTS clause.
DO $$ BEGIN
    CREATE TYPE "PartnerRole" AS ENUM ('client', 'trainer', 'manager', 'director');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add User.partner_role column with default 'client' (NOT NULL). Existing rows
--    get the default automatically, preserving backward compatibility.
ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "partner_role" "PartnerRole" NOT NULL DEFAULT 'client';

-- 3. Compound index for filtering users by role within a project (Prisma name).
CREATE INDEX IF NOT EXISTS "users_project_id_partner_role_idx"
    ON "users"("project_id", "partner_role");

-- 4. Project-level feature flag for the partner-role layer (opt-in per project).
--    Default false → no behavior change for existing projects.
ALTER TABLE "projects"
    ADD COLUMN IF NOT EXISTS "enable_partner_roles" BOOLEAN NOT NULL DEFAULT false;
