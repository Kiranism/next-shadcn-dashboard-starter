import { Bot, Context, session, SessionFlavor, InlineKeyboard } from 'grammy';
import { UserService, BonusService } from '@/lib/services/user.service';
import { ProjectService } from '@/lib/services/project.service';

// Интерфейс для сессии
interface SessionData {
  step?: string;
  projectId?: string;
  awaitingContact?: boolean;
  awaitingEmail?: boolean;
  linkingMethod?: 'phone' | 'email';
}

type MyContext = Context & SessionFlavor<SessionData>;

// Создаем бота
export function createBot(token: string, projectId: string) {
  const bot = new Bot<MyContext>(token);

  // Добавляем middleware для сессий
  bot.use(session({
    initial: (): SessionData => ({}),
  }));

  // Стартовая команда
  bot.command('start', async (ctx) => {
    const telegramId = BigInt(ctx.from!.id);
    const user = await UserService.getUserByTelegramId(telegramId);

    if (user && user.projectId === projectId) {
      // Пользователь уже привязан
      const balance = await UserService.getUserBalance(user.id);
      
      // Получаем информацию о проекте для приветствия
      const project = await ProjectService.getProjectById(projectId);
      
      const keyboard = new InlineKeyboard()
        .text('💰 Баланс', 'check_balance')
        .text('📝 История', 'view_history').row()
        .text('ℹ️ Помощь', 'show_help');
      
      await ctx.reply(
        `🎉 Добро пожаловать назад, ${user.firstName || 'друг'}!\n\n` +
        `🏪 Бонусная программа: ${project?.name || 'Наш магазин'}\n\n` +
        `💰 Ваш баланс бонусов: *${balance.currentBalance}₽*\n` +
        `🏆 Всего заработано: ${balance.totalEarned}₽\n` +
        `💸 Потрачено: ${balance.totalSpent}₽\n` +
        `⏰ Истекает в ближайшие 30 дней: ${balance.expiringSoon}₽\n\n` +
        `Выберите действие:`,
        { 
          parse_mode: 'Markdown',
          reply_markup: keyboard 
        }
      );
    } else {
      // Новый пользователь
      ctx.session.projectId = projectId;
      ctx.session.awaitingContact = true;
      
      // Получаем информацию о проекте
      const project = await ProjectService.getProjectById(projectId);
      const welcomeMessage = project?.botSettings?.welcomeMessage || 
        '🤖 Добро пожаловать в бонусную программу!';
      
      const keyboard = new InlineKeyboard()
        .text('📞 По номеру телефона', 'link_phone')
        .text('📧 По email', 'link_email').row()
        .text('❓ Помощь', 'show_help');
      
      await ctx.reply(
        `${welcomeMessage}\n\n` +
        `🏪 Программа: ${project?.name || 'Наш магазин'}\n\n` +
        `📱 Для участия в бонусной программе необходимо привязать ваш аккаунт.\n\n` +
        `Выберите способ привязки:`,
        { reply_markup: keyboard }
      );
    }
  });

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
          `💰 Ваш текущий баланс: ${balance.currentBalance}₽\n\n` +
          `Теперь вы можете использовать команды:\n` +
          `/balance - проверить баланс\n` +
          `/history - история операций\n` +
          `/help - помощь`,
          {
            reply_markup: { remove_keyboard: true },
          }
        );
      } else {
        await ctx.reply(
          '❌ Не удалось найти аккаунт с этим номером телефона.\n\n' +
          '📧 Попробуйте отправить email или обратитесь в поддержку.',
          {
            reply_markup: { remove_keyboard: true },
          }
        );
      }
    } catch (error) {
      // TODO: логгер
      await ctx.reply(
        '❌ Произошла ошибка при привязке аккаунта. Попробуйте позже.',
        {
          reply_markup: { remove_keyboard: true },
        }
      );
    }
  });

  // Обработка текстовых сообщений (для email)
  bot.on('message:text', async (ctx) => {
    if (!ctx.session.awaitingContact || !ctx.session.projectId) {
      return;
    }

    const text = ctx.message.text;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(text)) {
      const telegramId = BigInt(ctx.from.id);
      
      try {
        const user = await UserService.linkTelegramAccount(
          ctx.session.projectId,
          telegramId,
          ctx.from.username,
          { email: text }
        );

        if (user) {
          ctx.session.awaitingContact = false;
          
          const balance = await UserService.getUserBalance(user.id);
          
          await ctx.reply(
            `✅ Аккаунт успешно привязан!\n\n` +
            `👤 ${user.firstName || ''} ${user.lastName || ''}\n` +
            `📧 ${user.email}\n\n` +
            `💰 Ваш текущий баланс: ${balance.currentBalance}₽\n\n` +
            `Теперь вы можете использовать команды:\n` +
            `/balance - проверить баланс\n` +
            `/history - история операций\n` +
            `/help - помощь`
          );
        } else {
          await ctx.reply(
            '❌ Не удалось найти аккаунт с этим email.\n\n' +
            '📞 Попробуйте отправить номер телефона или обратитесь в поддержку.'
          );
        }
      } catch (error) {
        // TODO: логгер
        await ctx.reply('❌ Произошла ошибка при привязке аккаунта. Попробуйте позже.');
      }
    } else {
      await ctx.reply(
        '❌ Неверный формат email.\n\n' +
        '📧 Пожалуйста, отправьте корректный email адрес или воспользуйтесь кнопкой для отправки номера телефона.'
      );
    }
  });

  // Команда проверки баланса
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
      // TODO: логгер
      await ctx.reply('❌ Произошла ошибка при получении баланса. Попробуйте позже.');
    }
  });

  // Команда истории операций
  bot.command('history', async (ctx) => {
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
      const { transactions } = await BonusService.getUserTransactions(user.id, 1, 10);
      
      if (transactions.length === 0) {
        await ctx.reply('📝 У вас пока нет операций с бонусами.');
        return;
      }

      let message = '📝 Последние операции:\n\n';
      
      for (const transaction of transactions) {
        const date = transaction.createdAt.toLocaleDateString('ru-RU');
        const type = transaction.type === 'EARN' ? '➕' : '➖';
        const amount = Number(transaction.amount);
        
        message += `${type} ${amount}₽ - ${transaction.description || 'Без описания'}\n`;
        message += `📅 ${date}\n\n`;
      }

      await ctx.reply(message);
    } catch (error) {
      // TODO: логгер
      await ctx.reply('❌ Произошла ошибка при получении истории. Попробуйте позже.');
    }
  });

  // Команда помощи
  bot.command('help', async (ctx) => {
    await ctx.reply(
      '🤖 Доступные команды:\n\n' +
      '/start - начать работу с ботом\n' +
      '/balance - проверить баланс бонусов\n' +
      '/history - посмотреть историю операций\n' +
      '/help - показать эту справку\n\n' +
      '❓ По вопросам обратитесь в поддержку.'
    );
  });

  // Обработчики callback queries (inline кнопки)
  bot.callbackQuery('check_balance', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = BigInt(ctx.from.id);
    const user = await UserService.getUserByTelegramId(telegramId);

    if (!user) {
      await ctx.editMessageText('❌ Ваш аккаунт не привязан.\n\nИспользуйте команду /start для привязки аккаунта.');
      return;
    }

    try {
      const balance = await UserService.getUserBalance(user.id);
      
      const keyboard = new InlineKeyboard()
        .text('📝 История', 'view_history')
        .text('🔙 Назад', 'back_to_main').row();
      
      await ctx.editMessageText(
        `💰 *Ваш баланс бонусов*\n\n` +
        `🏦 Текущий баланс: *${balance.currentBalance}₽*\n` +
        `🏆 Всего заработано: ${balance.totalEarned}₽\n` +
        `💸 Потрачено: ${balance.totalSpent}₽\n` +
        `⏰ Истекает в ближайшие 30 дни: ${balance.expiringSoon}₽`,
        { 
          parse_mode: 'Markdown',
          reply_markup: keyboard 
        }
      );
    } catch (error) {
      // TODO: логгер
      await ctx.editMessageText('❌ Произошла ошибка при получении баланса.');
    }
  });

  bot.callbackQuery('view_history', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = BigInt(ctx.from.id);
    const user = await UserService.getUserByTelegramId(telegramId);

    if (!user) {
      await ctx.editMessageText('❌ Ваш аккаунт не привязан.');
      return;
    }

    try {
      const { transactions } = await BonusService.getUserTransactions(user.id, 1, 5);
      
      const keyboard = new InlineKeyboard()
        .text('💰 Баланс', 'check_balance')
        .text('🔙 Назад', 'back_to_main').row();
      
      if (transactions.length === 0) {
        await ctx.editMessageText(
          '📝 *История операций*\n\n❌ У вас пока нет операций с бонусами.',
          { 
            parse_mode: 'Markdown',
            reply_markup: keyboard 
          }
        );
        return;
      }

      let message = '📝 *История операций*\n\n';
      
      for (const transaction of transactions) {
        const date = transaction.createdAt.toLocaleDateString('ru-RU');
        const type = transaction.type === 'EARN' ? '➕' : '➖';
        const amount = Number(transaction.amount);
        
        message += `${type} *${amount}₽* - ${transaction.description || 'Без описания'}\n`;
        message += `📅 ${date}\n\n`;
      }

      if (transactions.length === 5) {
        message += '_Показаны последние 5 операций_';
      }

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } catch (error) {
      // TODO: логгер
      await ctx.editMessageText('❌ Произошла ошибка при получении истории.');
    }
  });

  bot.callbackQuery('show_help', async (ctx) => {
    await ctx.answerCallbackQuery();
    
    const keyboard = new InlineKeyboard()
      .text('🔙 Назад', 'back_to_main');
    
    await ctx.editMessageText(
      `ℹ️ *Справка по боту*\n\n` +
      `🤖 *Доступные команды:*\n` +
      `/start - начать работу с ботом\n` +
      `/balance - проверить баланс бонусов\n` +
      `/history - посмотреть историю операций\n` +
      `/help - показать эту справку\n\n` +
      `💡 *Как это работает:*\n` +
      `• Совершайте покупки и получайте бонусы\n` +
      `• Тратьте бонусы при следующих покупках\n` +
      `• Следите за балансом и сроками действия\n\n` +
      `❓ По вопросам обратитесь в поддержку.`,
      { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      }
    );
  });

  bot.callbackQuery('back_to_main', async (ctx) => {
    await ctx.answerCallbackQuery();
    
    // Симулируем команду /start
    ctx.message = { text: '/start' } as any;
    await ctx.deleteMessage();
    
    // Вызываем стартовую команду
    const telegramId = BigInt(ctx.from.id);
    const user = await UserService.getUserByTelegramId(telegramId);

    if (user && user.projectId === projectId) {
      const balance = await UserService.getUserBalance(user.id);
      const project = await ProjectService.getProjectById(projectId);
      
      const keyboard = new InlineKeyboard()
        .text('💰 Баланс', 'check_balance')
        .text('📝 История', 'view_history').row()
        .text('ℹ️ Помощь', 'show_help');
      
      await ctx.reply(
        `🎉 Добро пожаловать назад, ${user.firstName || 'друг'}!\n\n` +
        `🏪 Бонусная программа: ${project?.name || 'Наш магазин'}\n\n` +
        `💰 Ваш баланс бонусов: *${balance.currentBalance}₽*\n` +
        `🏆 Всего заработано: ${balance.totalEarned}₽\n` +
        `💸 Потрачено: ${balance.totalSpent}₽\n` +
        `⏰ Истекает в ближайшие 30 дней: ${balance.expiringSoon}₽\n\n` +
        `Выберите действие:`,
        { 
          parse_mode: 'Markdown',
          reply_markup: keyboard 
        }
      );
    }
  });

  // Обработчики для процесса привязки аккаунта
  bot.callbackQuery('link_phone', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.awaitingContact = true;
    ctx.session.linkingMethod = 'phone';
    
    await ctx.deleteMessage();
    await ctx.reply(
      '📞 *Привязка по номеру телефона*\n\n' +
      'Нажмите кнопку ниже, чтобы отправить ваш номер телефона:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '📞 Отправить номер телефона', request_contact: true }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  });

  bot.callbackQuery('link_email', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.awaitingContact = true;
    ctx.session.linkingMethod = 'email';
    
    await ctx.editMessageText(
      '📧 *Привязка по email*\n\n' +
      'Отправьте ваш email адрес в следующем сообщении:',
      { parse_mode: 'Markdown' }
    );
  });

  // Обработка ошибок
  bot.catch((err) => {
    // TODO: логгер
  });

  return bot;
} 