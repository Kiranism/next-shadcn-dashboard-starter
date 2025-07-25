# 🔗 API Reference - Документация API

Полная документация REST API для SaaS Bonus System.

## 📋 Базовая информация

- **Base URL**: `https://your-domain.com/api`
- **API Version**: v1
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer tokens (для админки), Webhook secrets (для интеграции)

---

## 🔐 Аутентификация

### Webhook Authentication
Для webhook endpoints используется секретный ключ в URL:
```
POST /api/webhook/{webhookSecret}
```

### Admin API Authentication  
Для админских endpoints используется JWT:
```
Authorization: Bearer <jwt_token>
```

---

## 📞 Webhook API

### POST /api/webhook/[webhookSecret]

Универсальный endpoint для интеграции с внешними сайтами.

#### Параметры URL
- `webhookSecret` (string, required) - Уникальный секрет проекта

#### Общий формат запроса
```json
{
  "action": "register_user|purchase|spend_bonuses",
  "payload": { ... }
}
```

### ➕ Регистрация пользователя

**Action**: `register_user`

```json
{
  "action": "register_user",
  "email": "user@example.com",
  "phone": "+79123456789",
  "firstName": "Иван",
  "lastName": "Петров",
  "birthDate": "1990-01-15"
}
```

#### Параметры
| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `email` | string | * | Email пользователя |
| `phone` | string | * | Номер телефона |
| `firstName` | string | нет | Имя |
| `lastName` | string | нет | Фамилия |
| `birthDate` | string (YYYY-MM-DD) | нет | Дата рождения |

*один из email или phone обязателен

#### Ответ (201 Created)
```json
{
  "success": true,
  "message": "Пользователь успешно зарегистрирован",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "phone": "+79123456789"
  }
}
```

### 💰 Начисление бонусов за покупку

**Action**: `purchase`

```json
{
  "action": "purchase",
  "userEmail": "user@example.com",
  "userPhone": "+79123456789",
  "purchaseAmount": 1000,
  "orderId": "ORDER_123",
  "description": "Покупка товара X"
}
```

#### Параметры
| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `userEmail` | string | * | Email пользователя |
| `userPhone` | string | * | Номер телефона |
| `purchaseAmount` | number | да | Сумма покупки в рублях |
| `orderId` | string | да | ID заказа |
| `description` | string | нет | Описание покупки |

*один из userEmail или userPhone обязателен

#### Ответ (200 OK)
```json
{
  "success": true,
  "message": "Бонусы успешно начислены",
  "bonus": {
    "id": "bonus_def456",
    "amount": 10,
    "expiresAt": "2025-12-31T23:59:59Z"
  },
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "phone": "+79123456789"
  }
}
```

### 💸 Списание бонусов

**Action**: `spend_bonuses`

```json
{
  "action": "spend_bonuses",
  "userEmail": "user@example.com",
  "userPhone": "+79123456789",
  "bonusAmount": 50,
  "orderId": "ORDER_456",
  "description": "Оплата бонусами"
}
```

#### Параметры
| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `userEmail` | string | * | Email пользователя |
| `userPhone` | string | * | Номер телефона |
| `bonusAmount` | number | да | Сумма к списанию |
| `orderId` | string | да | ID заказа |
| `description` | string | нет | Описание операции |

*один из userEmail или userPhone обязателен

#### Ответ (200 OK)
```json
{
  "success": true,
  "message": "Бонусы успешно списаны",
  "spent": {
    "amount": 50,
    "transactionsCount": 2
  },
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "phone": "+79123456789"
  }
}
```

### GET /api/webhook/[webhookSecret]

Проверка статуса webhook endpoint.

#### Ответ (200 OK)
```json
{
  "project": "Мой интернет-магазин",
  "status": "active",
  "webhookEndpoint": "/api/webhook/abc123xyz",
  "supportedActions": [
    "register_user",
    "purchase",
    "spend_bonuses"
  ]
}
```

---

## 👨‍💼 Admin API

### Проекты

#### GET /api/projects

Получение списка проектов с пагинацией.

**Параметры запроса**:
- `page` (number, default: 1) - Номер страницы
- `limit` (number, default: 10) - Количество на странице
- `search` (string) - Поиск по названию

#### Ответ (200 OK)
```json
{
  "projects": [
    {
      "id": "project_abc123",
      "name": "Интернет-магазин А",
      "domain": "shop-a.com",
      "webhookSecret": "webhook_secret_123",
      "bonusPercentage": 1.5,
      "bonusExpiryDays": 365,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "usersCount": 150
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

#### POST /api/projects

Создание нового проекта.

**Тело запроса**:
```json
{
  "name": "Новый магазин",
  "domain": "new-shop.com",
  "bonusPercentage": 2.0,
  "bonusExpiryDays": 180
}
```

#### Ответ (201 Created)
```json
{
  "id": "project_new123",
  "name": "Новый магазин",
  "domain": "new-shop.com",
  "webhookSecret": "generated_secret_456",
  "bonusPercentage": 2.0,
  "bonusExpiryDays": 180,
  "isActive": true,
  "createdAt": "2024-12-31T10:00:00Z"
}
```

#### GET /api/projects/[id]

Получение проекта по ID.

#### PUT /api/projects/[id]

Обновление проекта.

#### DELETE /api/projects/[id]

Деактивация проекта.

### Пользователи проекта

#### GET /api/projects/[id]/users

Получение пользователей проекта.

**Параметры запроса**:
- `page` (number) - Номер страницы
- `limit` (number) - Количество на странице
- `search` (string) - Поиск по email/телефону

#### Ответ (200 OK)
```json
{
  "users": [
    {
      "id": "user_abc123",
      "email": "user@example.com",
      "phone": "+79123456789",
      "firstName": "Иван",
      "lastName": "Петров",
      "telegramId": 123456789,
      "isActive": true,
      "registeredAt": "2024-01-01T00:00:00Z",
      "balance": {
        "current": 150,
        "totalEarned": 200,
        "totalSpent": 50
      }
    }
  ],
  "total": 1
}
```

### Статистика проекта

#### GET /api/projects/[id]/stats

Получение статистики проекта.

#### Ответ (200 OK)
```json
{
  "totalUsers": 150,
  "totalBonuses": 2500,
  "totalTransactions": 450,
  "activeBonuses": 1800,
  "expiredBonuses": 200,
  "spentBonuses": 500,
  "recentActivity": [
    {
      "date": "2024-12-31",
      "newUsers": 5,
      "bonusesEarned": 120,
      "bonusesSpent": 80
    }
  ]
}
```

### Бонусы и транзакции

#### POST /api/projects/[id]/bonuses

Ручное начисление бонусов.

**Тело запроса**:
```json
{
  "userId": "user_abc123",
  "amount": 100,
  "type": "MANUAL",
  "description": "Бонус за лояльность",
  "expiresAt": "2025-06-30T23:59:59Z"
}
```

#### GET /api/projects/[id]/transactions

История транзакций проекта.

### Webhook логи

#### GET /api/projects/[id]/webhook-logs

Логи webhook запросов.

**Параметры запроса**:
- `page` (number) - Номер страницы
- `limit` (number) - Количество на странице
- `status` (number) - Фильтр по HTTP статусу
- `success` (boolean) - Фильтр по успешности

#### Ответ (200 OK)
```json
{
  "logs": [
    {
      "id": "log_abc123",
      "endpoint": "/api/webhook/secret123",
      "method": "POST",
      "status": 200,
      "success": true,
      "headers": {
        "content-type": "application/json"
      },
      "body": {
        "action": "purchase",
        "purchaseAmount": 1000
      },
      "response": {
        "success": true,
        "message": "Бонусы успешно начислены"
      },
      "createdAt": "2024-12-31T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

## ❌ Коды ошибок

| Код | Описание | Примеры |
|-----|----------|---------|
| 400 | Bad Request | Неверный формат данных, отсутствуют обязательные поля |
| 401 | Unauthorized | Неверный webhook secret или JWT токен |
| 403 | Forbidden | Проект деактивирован, недостаточно прав |
| 404 | Not Found | Проект/пользователь не найден |
| 409 | Conflict | Пользователь уже существует |
| 422 | Unprocessable Entity | Недостаточно бонусов для списания |
| 500 | Internal Server Error | Ошибка сервера |

### Формат ошибки
```json
{
  "error": "Описание ошибки",
  "details": "Дополнительные детали",
  "code": "ERROR_CODE"
}
```

---

## 📝 Примеры использования

### cURL примеры

#### Регистрация пользователя
```bash
curl -X POST https://your-domain.com/api/webhook/YOUR_SECRET \
  -H "Content-Type: application/json" \
  -d '{
    "action": "register_user",
    "email": "test@example.com",
    "firstName": "Тест",
    "lastName": "Пользователь"
  }'
```

#### Начисление бонусов
```bash
curl -X POST https://your-domain.com/api/webhook/YOUR_SECRET \
  -H "Content-Type: application/json" \
  -d '{
    "action": "purchase",
    "userEmail": "test@example.com",
    "purchaseAmount": 500,
    "orderId": "ORDER_001"
  }'
```

#### Списание бонусов
```bash
curl -X POST https://your-domain.com/api/webhook/YOUR_SECRET \
  -H "Content-Type: application/json" \
  -d '{
    "action": "spend_bonuses",
    "userEmail": "test@example.com",
    "bonusAmount": 25,
    "orderId": "ORDER_002"
  }'
```

---

## 🔄 Rate Limiting

- **Webhook API**: 100 запросов в минуту на проект
- **Admin API**: 1000 запросов в час на пользователя

При превышении лимита возвращается статус 429 Too Many Requests.

---

## 📊 Мониторинг

Все API вызовы логируются для мониторинга и отладки:
- Время ответа
- Статус коды
- Payload размеры
- Ошибки и исключения

---

**Версия API**: 1.0  
**Последнее обновление**: 2024-12-31 