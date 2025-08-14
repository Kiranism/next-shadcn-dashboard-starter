#!/bin/bash
# Скрипт автоматического бэкапа PostgreSQL базы данных

set -e

# Конфигурация
DB_HOST="postgres"
DB_USER="${DB_USER:-bonus_admin}"
DB_NAME="${DB_NAME:-bonus_system}"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${DATE}.sql"
RETENTION_DAYS=7

# Создание директории для бэкапов
mkdir -p "${BACKUP_DIR}"

echo "🗄️ Начинаем бэкап базы данных ${DB_NAME}..."

# Создание бэкапа
pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
    --no-password \
    --verbose \
    --format=custom \
    --no-owner \
    --no-privileges \
    --file="${BACKUP_FILE}.dump"

# Создание SQL версии для просмотра
pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
    --no-password \
    --verbose \
    --no-owner \
    --no-privileges \
    > "${BACKUP_FILE}"

# Сжатие бэкапов
gzip "${BACKUP_FILE}"
gzip "${BACKUP_FILE}.dump"

echo "✅ Бэкап создан: ${BACKUP_FILE}.gz"

# Очистка старых бэкапов
echo "🧹 Удаление бэкапов старше ${RETENTION_DAYS} дней..."
find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.gz" -mtime +${RETENTION_DAYS} -delete

# Статистика
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/backup_${DB_NAME}_*.gz | wc -l)

echo "📊 Размер бэкапа: ${BACKUP_SIZE}"
echo "📁 Всего бэкапов: ${BACKUP_COUNT}"
echo "✅ Бэкап завершен успешно!"

# Опционально: отправка в облачное хранилище
# if [ ! -z "${S3_BUCKET}" ]; then
#     echo "☁️ Загрузка в S3..."
#     aws s3 cp "${BACKUP_FILE}.gz" "s3://${S3_BUCKET}/backups/"
# fi
