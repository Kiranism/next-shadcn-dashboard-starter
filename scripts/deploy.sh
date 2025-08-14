#!/bin/bash
# Скрипт автоматического деплоя SaaS Bonus System

set -e

# Конфигурация
PROJECT_DIR="/home/deploy/next-shadcn-dashboard-starter"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
BACKUP_BEFORE_DEPLOY=true
BRANCH="main"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Проверка окружения
check_requirements() {
    log_info "Проверка системных требований..."
    
    command -v docker >/dev/null 2>&1 || { log_error "Docker не установлен!"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose не установлен!"; exit 1; }
    command -v git >/dev/null 2>&1 || { log_error "Git не установлен!"; exit 1; }
    
    log_success "Все требования выполнены"
}

# Бэкап перед деплоем
backup_database() {
    if [ "$BACKUP_BEFORE_DEPLOY" = true ]; then
        log_info "Создание бэкапа базы данных..."
        cd "$PROJECT_DIR"
        docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm backup /backup.sh
        log_success "Бэкап создан"
    fi
}

# Обновление кода
update_code() {
    log_info "Обновление кода из Git..."
    cd "$PROJECT_DIR"
    
    # Сохранение локальных изменений
    git stash push -m "Auto-stash before deploy $(date)"
    
    # Обновление кода
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    
    log_success "Код обновлен"
}

# Сборка и деплой
deploy_services() {
    log_info "Сборка и деплой сервисов..."
    cd "$PROJECT_DIR"
    
    # Остановка старых контейнеров
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Сборка новых образов
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache app
    
    # Запуск сервисов
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    log_success "Сервисы запущены"
}

# Применение миграций
run_migrations() {
    log_info "Применение миграций базы данных..."
    cd "$PROJECT_DIR"
    
    # Ожидание готовности базы данных
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U bonus_admin -d bonus_system
    
    # Применение миграций
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T app pnpm prisma migrate deploy
    
    log_success "Миграции применены"
}

# Проверка здоровья
health_check() {
    log_info "Проверка здоровья сервисов..."
    cd "$PROJECT_DIR"
    
    # Ожидание запуска сервисов
    sleep 30
    
    # Проверка статуса контейнеров
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Exit"; then
        log_error "Некоторые контейнеры не запустились!"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs
        exit 1
    fi
    
    # Проверка доступности приложения
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        log_success "Приложение работает корректно"
    else
        log_error "Приложение не отвечает на health check!"
        exit 1
    fi
}

# Очистка старых образов
cleanup() {
    log_info "Очистка неиспользуемых Docker образов..."
    docker image prune -f
    docker volume prune -f
    log_success "Очистка завершена"
}

# Основная функция деплоя
main() {
    log_info "🚀 Начинаем деплой SaaS Bonus System..."
    
    check_requirements
    backup_database
    update_code
    deploy_services
    run_migrations
    health_check
    cleanup
    
    log_success "🎉 Деплой завершен успешно!"
    log_info "Приложение доступно по адресу: https://your-domain.ru"
}

# Запуск с обработкой ошибок
if ! main "$@"; then
    log_error "Деплой завершился с ошибкой!"
    log_info "Логи для диагностики:"
    cd "$PROJECT_DIR"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=50
    exit 1
fi
