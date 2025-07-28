/**
 * @file: architecture-update-plan.md
 * @description: План обновления архитектуры SaaS Bonus System
 * @project: SaaS Bonus System
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

# План обновления архитектуры SaaS Bonus System

## 🎯 Новые требования

### 1. Самостоятельная настройка ботов
- Владелец магазина сам указывает Bot Token своего бота
- Админ системы не создает ботов

### 2. Многоуровневая система бонусов
```
БАЗОВЫЙ УРОВЕНЬ (< 10,000₽)
- 5% бонусов от покупок
- До 10% оплаты заказа бонусами

СЕРЕБРЯНЫЙ УРОВЕНЬ (10,000₽ - 20,000₽)  
- 7% бонусов от покупок
- До 15% оплаты заказа бонусами

ЗОЛОТОЙ УРОВЕНЬ (> 20,000₽)
- 10% бонусов от покупок  
- До 20% оплаты заказа бонусами
```

### 3. Реферальная система с UTM метками
- Отслеживание UTM меток в webhook
- Начисление бонусов за приведенных клиентов

## 🗄️ Изменения в базе данных

### Новые таблицы

#### BonusLevel
```prisma
model BonusLevel {
  id          String  @id @default(cuid())
  projectId   String
  project     Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  name        String  // "Базовый", "Серебряный", "Золотой"
  minAmount   Decimal @default(0)
  maxAmount   Decimal? // null для последнего уровня
  
  bonusPercent    Int // 5, 7, 10
  paymentPercent  Int // 10, 15, 20
  
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("bonus_levels")
}
```

#### ReferralProgram
```prisma
model ReferralProgram {
  id          String  @id @default(cuid())
  projectId   String
  project     Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  isActive        Boolean @default(true)
  bonusPercent    Int     @default(5) // % от покупки рефера
  referrerBonus   Decimal @default(0) // фиксированный бонус рефереру
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("referral_programs")
}
```

### Изменения существующих таблиц

#### Project (добавить поля)
```prisma
model Project {
  // ... существующие поля
  
  // Настройки бота
  botToken      String? // Токен бота от владельца
  botUsername   String? // Username бота
  botStatus     BotStatus @default(INACTIVE)
  
  // Связи
  bonusLevels     BonusLevel[]
  referralProgram ReferralProgram?
  
  @@map("projects")
}

enum BotStatus {
  INACTIVE   // Бот не настроен
  ACTIVE     // Бот работает
  ERROR      // Ошибка настройки
}
```

#### User (добавить поля)
```prisma
model User {
  // ... существующие поля
  
  // Статистика для уровней
  totalPurchases    Decimal @default(0)
  currentLevel      String  @default("Базовый")
  
  // Реферальная система
  referredBy        String? // ID пользователя-рефера
  referrer          User?   @relation("UserReferrals", fields: [referredBy], references: [id])
  referrals         User[]  @relation("UserReferrals")
  
  utmSource         String? // UTM метки при регистрации
  utmMedium         String?
  utmCampaign       String?
  utmContent        String?
  utmTerm           String?
  
  @@map("users")
}
```

#### Transaction (добавить поля)
```prisma
model Transaction {
  // ... существующие поля
  
  // Контекст уровня
  userLevel         String? // Уровень пользователя на момент операции
  appliedPercent    Int?    // Применённый процент бонусов
  
  // Реферальная система
  isReferralBonus   Boolean @default(false)
  referralUserId    String? // Кому начислен реферальный бонус
  
  @@map("transactions")
}
```

## 🔧 Изменения в API

### Новые endpoints

#### Bot Management
```
POST /api/projects/[id]/bot/setup
- Настройка бота владельцем магазина
- Валидация Bot Token через Telegram API

GET /api/projects/[id]/bot/status  
- Статус бота (активен/неактивен/ошибка)

POST /api/projects/[id]/bot/test
- Тестирование бота
```

#### Bonus Levels
```
GET /api/projects/[id]/bonus-levels
- Получение настроек уровней

POST /api/projects/[id]/bonus-levels
- Создание/обновление уровней

PUT /api/projects/[id]/bonus-levels/[levelId]
- Редактирование уровня
```

#### Referral System
```
GET /api/projects/[id]/referral
- Настройки реферальной программы

POST /api/projects/[id]/referral
- Создание/обновление реферальной программы

GET /api/projects/[id]/referral/stats
- Статистика по рефералам
```

### Изменения в webhook API

#### Обновленные payload схемы
```typescript
interface WebhookRegisterUserPayload {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  
  // UTM метки для реферальной системы
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  
  // Реферальный код (опционально)
  referralCode?: string;
}

interface WebhookPurchasePayload {
  userEmail?: string;
  userPhone?: string;
  purchaseAmount: number;
  orderId: string;
  description?: string;
  
  // UTM метки покупки
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}
```

## 🎨 Изменения в UI

### Новые страницы/компоненты

#### `/projects/[id]/bot-setup`
- Форма ввода Bot Token
- Валидация токена в реальном времени
- Статус бота и диагностика

#### `/projects/[id]/bonus-levels`  
- Настройка уровней бонусной программы
- Drag & drop для изменения порядка
- Предпросмотр расчётов

#### `/projects/[id]/referral`
- Настройки реферальной программы
- Генерация реферальных ссылок
- Статистика по рефералам

#### Обновления существующих страниц
- **Users View**: показ текущего уровня пользователя
- **Analytics**: добавить метрики по уровням и рефералам
- **Project Settings**: секция с настройками бота

## 🤖 Изменения в Telegram боте

### Новые команды
```
/level - Показать текущий уровень и прогресс
/referral - Получить реферальную ссылку
/invite - Пригласить друга (с генерацией UTM ссылки)
```

### Обновленные команды
```
/balance - Показать баланс + текущий уровень + прогресс
/history - История с указанием уровня на момент операции
```

## 📊 Логика бизнес-процессов

### Определение уровня пользователя
```typescript
function calculateUserLevel(totalPurchases: number, bonusLevels: BonusLevel[]): BonusLevel {
  // Сортируем уровни по minAmount
  const sortedLevels = bonusLevels.sort((a, b) => Number(a.minAmount) - Number(b.minAmount));
  
  // Находим подходящий уровень
  for (let i = sortedLevels.length - 1; i >= 0; i--) {
    const level = sortedLevels[i];
    if (totalPurchases >= Number(level.minAmount)) {
      if (!level.maxAmount || totalPurchases <= Number(level.maxAmount)) {
        return level;
      }
    }
  }
  
  return sortedLevels[0]; // Базовый уровень по умолчанию
}
```

### Реферальные начисления
```typescript
async function processReferralBonus(
  userId: string, 
  purchaseAmount: number, 
  utmSource?: string
) {
  // Если есть UTM метка или прямая привязка к рефереру
  const user = await getUserWithReferrer(userId);
  if (!user.referrer) return;
  
  const referralProgram = await getReferralProgram(user.projectId);
  if (!referralProgram.isActive) return;
  
  // Начисляем бонус рефереру
  const bonusAmount = (purchaseAmount * referralProgram.bonusPercent) / 100;
  await BonusService.awardReferralBonus(
    user.referrer.id,
    bonusAmount,
    userId,
    `Реферальный бонус за покупку ${user.firstName || 'пользователя'}`
  );
}
```

## 🚀 План реализации

### Этап 1: База данных и модели (2-3 дня)
1. Обновить schema.prisma
2. Создать и применить миграции
3. Обновить TypeScript типы

### Этап 2: API endpoints (3-4 дня)
1. Bot setup API
2. Bonus levels API  
3. Referral program API
4. Обновить webhook API

### Этап 3: UI компоненты (4-5 дней)
1. Bot setup страница
2. Bonus levels настройки
3. Referral program UI
4. Обновить существующие страницы

### Этап 4: Telegram бот (2-3 дня)
1. Обновить логику команд
2. Добавить новые команды
3. Интеграция с новыми API

### Этап 5: Тестирование и документация (2 дня)
1. End-to-end тесты
2. Обновить документацию
3. Миграция существующих данных

## 📋 Критические точки

### Безопасность
- Валидация Bot Token через официальный Telegram API
- Sanitization UTM параметров
- Rate limiting для реферальных операций

### Производительность  
- Индексы на новые поля в БД
- Кэширование уровней пользователей
- Оптимизация расчёта реферальных бонусов

### Совместимость
- Миграция существующих пользователей на базовый уровень
- Сохранение работоспособности старых webhook интеграций
- Постепенное внедрение новых возможностей

---

**Готовность к реализации**: План готов к началу разработки. Начинаем с базы данных? 🚀 