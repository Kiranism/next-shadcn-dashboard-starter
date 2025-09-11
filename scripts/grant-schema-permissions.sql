-- Предоставление прав пользователю bonus_user на схему public
-- Выполните эти команды в pgAdmin или через psql

-- 1. Предоставить права на схему public
GRANT USAGE ON SCHEMA public TO bonus_user;
GRANT CREATE ON SCHEMA public TO bonus_user;

-- 2. Предоставить права на все существующие таблицы в схеме public
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bonus_user;

-- 3. Предоставить права на все существующие последовательности в схеме public
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bonus_user;

-- 4. Предоставить права на все существующие функции в схеме public
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO bonus_user;

-- 5. Установить права по умолчанию для будущих объектов
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bonus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bonus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO bonus_user;

-- Проверить права
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public';

-- Проверить права пользователя
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE grantee = 'bonus_user' 
AND table_schema = 'public';
