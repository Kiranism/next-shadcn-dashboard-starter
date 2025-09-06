/*
  Warnings:

  - A unique constraint covering the columns `[project_id,telegram_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."AdminRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'MANAGER');

-- Drop previous unique on telegram_id if present (index or constraint)
ALTER TABLE "public"."users" DROP CONSTRAINT IF EXISTS "users_telegram_id_key";
DROP INDEX IF EXISTS "public"."users_telegram_id_key";

-- CreateTable
CREATE TABLE "public"."admin_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "public"."AdminRole" NOT NULL DEFAULT 'ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_accounts_email_key" ON "public"."admin_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_project_id_telegram_id_key" ON "public"."users"("project_id", "telegram_id");
