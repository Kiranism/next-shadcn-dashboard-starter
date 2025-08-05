-- Расширяем настройки бота для поддержки функциональных настроек
ALTER TABLE "bot_settings" ADD COLUMN "message_settings" JSONB DEFAULT '{}';
ALTER TABLE "bot_settings" ADD COLUMN "functional_settings" JSONB DEFAULT '{}';

-- Обновляем существующие записи с настройками по умолчанию
UPDATE "bot_settings" SET 
  "message_settings" = '{
    "welcomeMessage": "Добро пожаловать! Отправьте свой номер телефона для привязки аккаунта.",
    "balanceMessage": "Ваш баланс бонусов: {balance}",
    "helpMessage": "Доступные команды:\n/start - начать работу\n/balance - проверить баланс\n/help - показать помощь"
  }',
  "functional_settings" = '{
    "showBalance": true,
    "showLevel": true,
    "showReferral": true,
    "showHistory": true,
    "showHelp": true
  }'
WHERE "message_settings" IS NULL OR "functional_settings" IS NULL;