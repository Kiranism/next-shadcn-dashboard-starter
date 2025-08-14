/**
 * @file: check-bot-status.ts
 * @description: Скрипт для проверки статуса бота
 * @project: SaaS Bonus System
 * @dependencies: Prisma, @/lib/db
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { db } from '../src/lib/db';

async function checkBotStatus() {
  try {
    const projectId = 'cmdkloj85000cv8o0611rblp3';

    // Проверяем проект
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      console.error('❌ Проект не найден');
      return;
    }

    console.log('✅ Проект:', project.name);
    console.log(
      '🤖 Bot Token:',
      project.botToken ? '✅ Установлен' : '❌ Не установлен'
    );
    console.log('🤖 Bot Username:', project.botUsername || '❌ Не установлен');
    console.log('🤖 Bot Status:', project.botStatus);

    // Проверяем настройки бота
    const botSettings = await db.botSettings.findUnique({
      where: { projectId }
    });

    if (botSettings) {
      console.log('⚙️ Bot Settings:');
      console.log('   Is Active:', botSettings.isActive);
      console.log(
        '   Bot Token:',
        botSettings.botToken ? '✅ Установлен' : '❌ Не установлен'
      );
      console.log(
        '   Bot Username:',
        botSettings.botUsername || '❌ Не установлен'
      );
    } else {
      console.log('❌ Настройки бота не найдены');
    }

    // Проверяем пользователей
    const totalUsers = await db.user.count({
      where: { projectId }
    });

    const telegramUsers = await db.user.count({
      where: {
        projectId,
        telegramId: { not: null },
        isActive: true
      }
    });

    console.log('👥 Пользователи:');
    console.log(`   Всего: ${totalUsers}`);
    console.log(`   С telegramId: ${telegramUsers}`);
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await db.$disconnect();
  }
}

checkBotStatus();
