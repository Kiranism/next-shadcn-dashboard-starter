-- Создание enum для каналов уведомлений
CREATE TYPE "NotificationChannel" AS ENUM ('TELEGRAM', 'EMAIL', 'SMS');

-- Создание таблицы уведомлений
CREATE TABLE "notifications" (
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

-- Добавление внешних ключей
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Создание индексов для оптимизации
CREATE INDEX "notifications_project_id_idx" ON "notifications"("project_id");
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_channel_idx" ON "notifications"("channel");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");
