-- Partner organizations (B2B networks: fitness clubs, etc.)
CREATE TABLE "partner_organizations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "default_referral_commission_plan_id" TEXT,
    "director_user_id" TEXT,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_organizations_project_id_slug_key" ON "partner_organizations"("project_id", "slug");
CREATE INDEX "partner_organizations_project_id_idx" ON "partner_organizations"("project_id");

ALTER TABLE "partner_organizations" ADD CONSTRAINT "partner_organizations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_organizations" ADD CONSTRAINT "partner_organizations_default_referral_commission_plan_id_fkey" FOREIGN KEY ("default_referral_commission_plan_id") REFERENCES "referral_commission_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "users" ADD COLUMN "organization_id" TEXT;
CREATE INDEX "users_project_id_organization_id_idx" ON "users"("project_id", "organization_id");
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "partner_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_attributions" ADD COLUMN "organization_id" TEXT;
CREATE INDEX "referral_attributions_organization_id_idx" ON "referral_attributions"("organization_id");
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "partner_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
