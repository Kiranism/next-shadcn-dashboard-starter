import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addNotificationsTable() {
  try {
    console.log('Создание enum NotificationChannel...');
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "NotificationChannel" AS ENUM ('TELEGRAM', 'EMAIL', 'SMS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    console.log('Создание таблицы notifications...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" TEXT NOT NULL,
        "project_id" TEXT NOT NULL,
        "user_id" TEXT,
        "channel" "NotificationChannel" NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "metadata" JSONB,
        "sent_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
      );
    `;

    console.log('Добавление внешних ключей...');
    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_fkey" 
        FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    console.log('Создание индексов...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "notifications_project_id_idx" ON "notifications"("project_id");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "notifications_channel_idx" ON "notifications"("channel");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("created_at");`;

    console.log('✅ Таблица notifications успешно создана!');
  } catch (error) {
    console.error('❌ Ошибка при создании таблицы:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addNotificationsTable();
