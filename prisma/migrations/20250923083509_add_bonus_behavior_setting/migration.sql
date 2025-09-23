-- CreateEnum
CREATE TYPE "BonusBehavior" AS ENUM ('spend_and_earn', 'spend_only', 'earn_only');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "bonus_behavior" "BonusBehavior" NOT NULL DEFAULT 'spend_and_earn';