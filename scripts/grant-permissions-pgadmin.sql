-- Предоставление прав пользователю bonus_user на схему public
-- Выполните эти команды в pgAdmin Query Tool

-- 1. Предоставить права на схему public
GRANT USAGE ON SCHEMA public TO bonus_user;
GRANT CREATE ON SCHEMA public TO bonus_user;

-- 2. Предоставить права на все существующие таблицы
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bonus_user;

-- 3. Предоставить права на все существующие последовательности
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bonus_user;

-- 4. Установить права по умолчанию для будущих объектов
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bonus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bonus_user;

-- Проверить результат
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public';
