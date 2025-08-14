#!/bin/bash
# Health check скрипт для Docker контейнера

set -e

# Проверка, что приложение отвечает
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ App is healthy"
    exit 0
else
    echo "❌ App health check failed"
    exit 1
fi
