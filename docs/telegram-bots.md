# 🤖 Telegram Bots Guide - Руководство по Telegram ботам

Полное руководство по настройке, управлению и работе с Telegram ботами в SaaS Bonus System.

## 📋 Обзор

SaaS Bonus System поддерживает создание отдельных Telegram ботов для каждого проекта. Каждый бот работает независимо и имеет свои настройки, пользователей и конфигурацию.

### 🎯 Возможности ботов:
- Привязка аккаунтов по телефону или email
- Проверка баланса бонусов
- Просмотр истории операций
- Уведомления о начислениях
- Настраиваемые сообщения и команды

---

## 🚀 Создание и настройка бота

### 1. Создание бота в Telegram

1. **Откройте @BotFather** в Telegram
2. **Отправьте команду** `/newbot`
3. **Введите название** вашего бота (например: "Мой Магазин Бонусы")
4. **Введите username** бота (например: `my_shop_bonus_bot`)
5. **Сохраните токен** бота (например: `1234567890:ABCdef...`)

### 2. Настройка в админ панели

```typescript
// Пример настройки через API
const botSettings = {
  projectId: "project_abc123",
  botToken: "1234567890:ABCdef...",
  botUsername: "my_shop_bonus_bot",
  isActive: true,
  welcomeMessage: {
    text: "🎉 Добро пожаловать в бонусную программу МойМагазин!\n\nДля начала работы поделитесь номером телефона или напишите email.",
    buttons: [
      {
        text: "📞 Отправить номер телефона",
        requestContact: true
      }
    ]
  }
};
```

### 3. Настройка команд бота

В @BotFather настройте список команд:
```
start - Начать работу с ботом
balance - Проверить баланс бонусов
history - История операций
help - Справка по командам
```

---

## 💬 Команды и функциональность

### /start - Начало работы

**Для новых пользователей:**
```
🤖 Добро пожаловать в бонусную программу!

📱 Для привязки вашего аккаунта, пожалуйста, поделитесь номером телефона или напишите ваш email.

📞 Нажмите кнопку ниже для отправки номера телефона:
[📞 Отправить номер телефона]
```

**Для существующих пользователей:**
```
🎉 Добро пожаловать назад, Иван!

💰 Ваш баланс бонусов: 150₽
🏆 Всего заработано: 300₽
💸 Потрачено: 150₽
⏰ Истекает в ближайшие 30 дней: 50₽

Используйте команды:
/balance - проверить баланс
/history - история операций
/help - помощь
```

### /balance - Баланс бонусов

```
💰 Ваш баланс бонусов

🏦 Текущий баланс: 150₽
🏆 Всего заработано: 300₽
💸 Потрачено: 150₽
⏰ Истекает в ближайшие 30 дней: 50₽
```

### /history - История операций

```
📝 Последние операции:

➕ 25₽ - Бонус за покупку на сумму 1000₽
📅 31.12.2024

➖ 50₽ - Списание бонусов
📅 30.12.2024

➕ 100₽ - Бонус ко дню рождения
📅 29.12.2024
```

### /help - Справка

```
ℹ️ Справка по боту

🤖 Доступные команды:
/start - начать работу с ботом
/balance - проверить баланс бонусов
/history - посмотреть историю операций
/help - показать эту справку

💡 Как это работает:
• Совершайте покупки и получайте бонусы
• Тратьте бонусы при следующих покупках
• Следите за балансом и сроками действия

❓ По вопросам обратитесь в поддержку.
```

### 🎛️ Интерактивные элементы

Современные боты используют **inline клавиатуры** для удобной навигации:

- **Главное меню**: Кнопки "💰 Баланс", "📝 История", "ℹ️ Помощь"
- **Навигация**: Кнопки "🔙 Назад" для возврата к предыдущему экрану
- **Привязка аккаунта**: Выбор между телефоном и email
- **Форматирование**: Markdown для выделения важной информации

### 📱 Система уведомлений

Боты автоматически отправляют уведомления:

**При начислении бонусов:**
```
🛒 Новые бонусы начислены!

💰 Сумма: +25₽
📝 Тип: За покупку
📄 Описание: Покупка на сумму 1000₽

⏰ Срок действия: 31.12.2025

Используйте команду /balance чтобы посмотреть актуальный баланс! 🎉
```

**При списании бонусов:**
```
💸 Бонусы потрачены

💰 Сумма: -50₽
📄 За: Покупка в магазине

Спасибо за покупку! Используйте /balance для проверки баланса.
```

**Предупреждение об истечении:**
```
⚠️ Внимание! Бонусы скоро истекут

💰 Сумма: 100₽
📅 Истекают: 31.01.2025
⏰ Осталось дней: 7

Поспешите воспользоваться бонусами! 🏃‍♂️
```

---

## 🔧 Техническая реализация

### Основной файл бота

```typescript
// src/lib/telegram/bot.ts
import { Bot, Context, session, SessionFlavor } from 'grammy';
import { UserService, BonusService } from '@/lib/services/user.service';

interface SessionData {
  step?: string;
  projectId?: string;
  awaitingContact?: boolean;
}

type MyContext = Context & SessionFlavor<SessionData>;

export function createBot(token: string, projectId: string) {
  const bot = new Bot<MyContext>(token);
  
  // Middleware для сессий
  bot.use(session({
    initial: (): SessionData => ({}),
  }));
  
  // Обработчики команд
  setupStartCommand(bot, projectId);
  setupBalanceCommand(bot);
  setupHistoryCommand(bot);
  setupHelpCommand(bot);
  setupContactHandler(bot);
  setupTextHandler(bot);
  
  return bot;
}
```

### Обработчик привязки аккаунта

```typescript
// Обработка отправки контакта
bot.on('message:contact', async (ctx) => {
  if (!ctx.session.awaitingContact || !ctx.session.projectId) {
    await ctx.reply('❌ Неожиданное действие. Попробуйте /start');
    return;
  }

  const contact = ctx.message.contact;
  const telegramId = BigInt(ctx.from.id);
  
  try {
    const user = await UserService.linkTelegramAccount(
      ctx.session.projectId,
      telegramId,
      ctx.from.username,
      { phone: contact.phone_number }
    );

    if (user) {
      ctx.session.awaitingContact = false;
      const balance = await UserService.getUserBalance(user.id);
      
      await ctx.reply(
        `✅ Аккаунт успешно привязан!\n\n` +
        `👤 ${user.firstName || ''} ${user.lastName || ''}\n` +
        `📞 ${user.phone}\n\n` +
        `💰 Ваш текущий баланс: ${balance.currentBalance}₽`,
        { reply_markup: { remove_keyboard: true } }
      );
    } else {
      await ctx.reply(
        '❌ Не удалось найти аккаунт с этим номером телефона.\n\n' +
        '📧 Попробуйте отправить email или обратитесь в поддержку.',
        { reply_markup: { remove_keyboard: true } }
      );
    }
  } catch (error) {
    console.error('Ошибка привязки аккаунта:', error);
    await ctx.reply(
      '❌ Произошла ошибка при привязке аккаунта. Попробуйте позже.',
      { reply_markup: { remove_keyboard: true } }
    );
  }
});
```

### Проверка баланса

```typescript
bot.command('balance', async (ctx) => {
  const telegramId = BigInt(ctx.from!.id);
  const user = await UserService.getUserByTelegramId(telegramId);

  if (!user) {
    await ctx.reply(
      '❌ Ваш аккаунт не привязан.\n\n' +
      'Используйте команду /start для привязки аккаунта.'
    );
    return;
  }

  try {
    const balance = await UserService.getUserBalance(user.id);
    
    await ctx.reply(
      `💰 Ваш баланс бонусов\n\n` +
      `🏦 Текущий баланс: ${balance.currentBalance}₽\n` +
      `🏆 Всего заработано: ${balance.totalEarned}₽\n` +
      `💸 Потрачено: ${balance.totalSpent}₽\n` +
      `⏰ Истекает в ближайшие 30 дней: ${balance.expiringSoon}₽`
    );
  } catch (error) {
    console.error('Ошибка получения баланса:', error);
    await ctx.reply('❌ Произошла ошибка при получении баланса. Попробуйте позже.');
  }
});
```

---

## 🎛️ Управление ботами

### Bot Manager класс

```typescript
// src/lib/telegram/bot-manager.ts
import { Bot } from 'grammy';
import { createBot } from './bot';
import { ProjectService } from '@/lib/services/project.service';

export class BotManager {
  private bots: Map<string, Bot> = new Map();
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async startBot(projectId: string): Promise<boolean> {
    try {
      const project = await ProjectService.getProjectById(projectId);
      
      if (!project?.botSettings?.botToken) {
        throw new Error('Bot token not found for project');
      }

      // Создаем нового бота
      const bot = createBot(project.botSettings.botToken, projectId);
      
      if (process.env.NODE_ENV === 'production') {
        // Production: используем webhook
        await bot.api.setWebhook(
          `${this.webhookUrl}/api/telegram/${projectId}`,
          { drop_pending_updates: true }
        );
      } else {
        // Development: используем polling
        bot.start();
      }

      this.bots.set(projectId, bot);
      
      console.log(`Bot started for project ${projectId}`);
      return true;
    } catch (error) {
      console.error(`Failed to start bot for project ${projectId}:`, error);
      return false;
    }
  }

  async stopBot(projectId: string): Promise<boolean> {
    try {
      const bot = this.bots.get(projectId);
      
      if (bot) {
        if (process.env.NODE_ENV === 'production') {
          await bot.api.deleteWebhook();
        } else {
          bot.stop();
        }
        
        this.bots.delete(projectId);
        console.log(`Bot stopped for project ${projectId}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to stop bot for project ${projectId}:`, error);
      return false;
    }
  }

  async restartBot(projectId: string): Promise<boolean> {
    await this.stopBot(projectId);
    return await this.startBot(projectId);
  }

  getBotStatus(projectId: string): 'running' | 'stopped' | 'error' {
    const bot = this.bots.get(projectId);
    return bot ? 'running' : 'stopped';
  }

  async startAllBots(): Promise<void> {
    const { projects } = await ProjectService.getProjects(1, 100);
    
    for (const project of projects) {
      if (project.botSettings?.isActive) {
        await this.startBot(project.id);
      }
    }
  }

  async stopAllBots(): Promise<void> {
    const projectIds = Array.from(this.bots.keys());
    
    for (const projectId of projectIds) {
      await this.stopBot(projectId);
    }
  }
}

// Глобальный экземпляр
export const botManager = new BotManager(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');
```

### Webhook обработчик

```typescript
// src/app/api/telegram/[projectId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { webhookCallback } from 'grammy';
import { botManager } from '@/lib/telegram/bot-manager';

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId;
  const bot = botManager.getBot(projectId);
  
  if (!bot) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
  }

  try {
    const handleUpdate = webhookCallback(bot, 'std/http');
    return await handleUpdate(req);
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
```

---

## 📊 Мониторинг и аналитика

### Метрики ботов

```typescript
// src/lib/telegram/analytics.ts
export interface BotMetrics {
  projectId: string;
  totalUsers: number;
  activeUsers: number; // активны за последние 7 дней
  messagesPerDay: number;
  commandUsage: Record<string, number>;
  errors: number;
}

export class BotAnalytics {
  async getBotMetrics(projectId: string): Promise<BotMetrics> {
    // Получаем метрики из БД
    const metrics = await db.botMetric.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });

    return {
      projectId,
      totalUsers: metrics?.totalUsers || 0,
      activeUsers: metrics?.activeUsers || 0,
      messagesPerDay: metrics?.messagesPerDay || 0,
      commandUsage: metrics?.commandUsage || {},
      errors: metrics?.errors || 0
    };
  }

  async logBotInteraction(
    projectId: string,
    userId: string,
    command: string,
    success: boolean
  ): Promise<void> {
    await db.botInteraction.create({
      data: {
        projectId,
        userId,
        command,
        success,
        timestamp: new Date()
      }
    });
  }
}
```

### Система логирования

```typescript
// src/lib/telegram/logger.ts
export class BotLogger {
  static log(level: 'info' | 'warn' | 'error', projectId: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      projectId,
      message,
      data: data ? JSON.stringify(data) : null
    };

    console.log(`[BOT-${level.toUpperCase()}] ${projectId}: ${message}`, data);

    // Сохраняем в БД для важных событий
    if (level === 'error') {
      db.botLog.create({ data: logEntry }).catch(console.error);
    }
  }

  static info(projectId: string, message: string, data?: any) {
    this.log('info', projectId, message, data);
  }

  static warn(projectId: string, message: string, data?: any) {
    this.log('warn', projectId, message, data);
  }

  static error(projectId: string, message: string, data?: any) {
    this.log('error', projectId, message, data);
  }
}
```

---

## 🎨 Кастомизация

### Настройка сообщений

```json
{
  "welcomeMessage": {
    "text": "🎉 Добро пожаловать в бонусную программу {shopName}!\n\nДля начала работы поделитесь номером телефона.",
    "variables": ["shopName"],
    "buttons": [
      {
        "text": "📞 Отправить номер телефона",
        "requestContact": true
      }
    ]
  },
  "balanceMessage": {
    "text": "💰 Ваш баланс: {currentBalance}₽\n🏆 Заработано: {totalEarned}₽\n💸 Потрачено: {totalSpent}₽",
    "variables": ["currentBalance", "totalEarned", "totalSpent"]
  },
  "bonusAwardedMessage": {
    "text": "🎉 Вам начислено {amount}₽ бонусов!\n\n💰 Ваш баланс: {newBalance}₽",
    "variables": ["amount", "newBalance"]
  }
}
```

### Мультиязычность

```typescript
// src/lib/telegram/i18n.ts
export const messages = {
  ru: {
    welcome: "🎉 Добро пожаловать в бонусную программу!",
    balance: "💰 Ваш баланс: {amount}₽",
    error: "❌ Произошла ошибка. Попробуйте позже."
  },
  en: {
    welcome: "🎉 Welcome to our bonus program!",
    balance: "💰 Your balance: {amount}₽",
    error: "❌ An error occurred. Please try again later."
  }
};

export function getMessage(key: string, lang: string = 'ru', variables: Record<string, any> = {}): string {
  let message = messages[lang]?.[key] || messages.ru[key] || key;
  
  // Заменяем переменные
  Object.entries(variables).forEach(([variable, value]) => {
    message = message.replace(`{${variable}}`, String(value));
  });
  
  return message;
}
```

---

## 🚀 Production настройка

### Docker контейнер для ботов

```dockerfile
# Dockerfile.bots
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:bots"]
```

### PM2 конфигурация

```json
{
  "apps": [
    {
      "name": "telegram-bots",
      "script": "dist/telegram/bot-manager.js",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "production",
        "DATABASE_URL": "postgresql://...",
        "WEBHOOK_URL": "https://your-domain.com"
      }
    }
  ]
}
```

### Nginx конфигурация

```nginx
# nginx.conf
location /api/telegram/ {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 🔒 Безопасность

### Валидация webhook

```typescript
function validateTelegramWebhook(req: NextRequest, botToken: string): boolean {
  const secretToken = crypto
    .createHmac('sha256', 'WebHook')
    .update(botToken)
    .digest();
    
  const telegramToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  
  return crypto.timingSafeEqual(
    Buffer.from(telegramToken || '', 'hex'),
    secretToken
  );
}
```

### Rate limiting

```typescript
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimiter.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}
```

---

## 📞 Поддержка и диагностика

### Команды для отладки

```bash
# Проверка статуса всех ботов
curl https://your-domain.com/api/admin/bots/status

# Перезапуск бота для проекта
curl -X POST https://your-domain.com/api/admin/bots/restart \
  -H "Content-Type: application/json" \
  -d '{"projectId": "project_abc123"}'

# Получение логов бота
curl https://your-domain.com/api/admin/bots/logs?projectId=project_abc123
```

### Мониторинг здоровья

```typescript
// Health check endpoint
export async function GET() {
  const projects = await ProjectService.getProjects();
  const status = [];
  
  for (const project of projects.projects) {
    if (project.botSettings?.isActive) {
      const botStatus = botManager.getBotStatus(project.id);
      status.push({
        projectId: project.id,
        projectName: project.name,
        botStatus,
        lastActivity: await getLastBotActivity(project.id)
      });
    }
  }
  
  return NextResponse.json({ status, timestamp: new Date().toISOString() });
}
```

---

**Версия**: 1.0  
**Последнее обновление**: 2024-12-31 