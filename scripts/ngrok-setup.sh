#!/bin/bash

# ===========================================
# NGROK SETUP SCRIPT для SaaS Bonus System
# ===========================================

echo "🚀 Настройка ngrok для тестирования webhook интеграции..."

# Проверяем установлен ли ngrok
if ! command -v ngrok &> /dev/null; then
    echo "📦 Установка ngrok..."
    npm install -g ngrok
    
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка установки ngrok через npm. Попробуйте:"
        echo "   - Windows: choco install ngrok"
        echo "   - macOS: brew install ngrok"
        echo "   - Linux: sudo snap install ngrok"
        exit 1
    fi
fi

echo "✅ ngrok установлен"

# Проверяем запущен ли проект
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "⚠️  Локальный сервер не запущен на порту 3000"
    echo "📝 Запустите в отдельном терминале: yarn dev"
    echo "⏳ Ожидание запуска сервера..."
    
    while ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; do
        sleep 2
        echo "   Проверяю localhost:3000..."
    done
fi

echo "✅ Локальный сервер работает"

# Запускаем ngrok
echo "🌐 Запуск ngrok туннеля..."
echo "📋 Скопируйте публичный URL из вывода ниже для настройки webhook'ов"
echo "🔗 Используйте HTTPS URL в формате: https://xxxxx.ngrok.io"
echo ""
echo "💡 Webhook endpoint будет: https://xxxxx.ngrok.io/api/webhook/[your-secret]"
echo ""
echo "⚡ Нажмите Ctrl+C для остановки"
echo "─".repeat(60)

ngrok http 3000
