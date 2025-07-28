/*
  Warnings:

  - A unique constraint covering the columns `[referral_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BotStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'ERROR');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "bot_status" "BotStatus" NOT NULL DEFAULT 'INACTIVE',
ADD COLUMN     "bot_token" TEXT,
ADD COLUMN     "bot_username" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "applied_percent" INTEGER,
ADD COLUMN     "is_referral_bonus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referral_user_id" TEXT,
ADD COLUMN     "user_level" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_level" TEXT NOT NULL DEFAULT 'Базовый',
ADD COLUMN     "referral_code" TEXT,
ADD COLUMN     "referred_by" TEXT,
ADD COLUMN     "total_purchases" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "utm_campaign" TEXT,
ADD COLUMN     "utm_content" TEXT,
ADD COLUMN     "utm_medium" TEXT,
ADD COLUMN     "utm_source" TEXT,
ADD COLUMN     "utm_term" TEXT;

-- CreateTable
CREATE TABLE "bonus_levels" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_amount" DECIMAL(10,2),
    "bonus_percent" INTEGER NOT NULL,
    "payment_percent" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_programs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "bonus_percent" INTEGER NOT NULL DEFAULT 5,
    "referrer_bonus" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bonus_levels_project_id_name_key" ON "bonus_levels"("project_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "referral_programs_project_id_key" ON "referral_programs"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- AddForeignKey
ALTER TABLE "bonus_levels" ADD CONSTRAINT "bonus_levels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_programs" ADD CONSTRAINT "referral_programs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
