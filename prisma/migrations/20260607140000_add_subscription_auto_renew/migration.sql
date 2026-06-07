-- AlterTable: auto_renew_enabled on subscriptions
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "auto_renew_enabled" BOOLEAN NOT NULL DEFAULT false;
