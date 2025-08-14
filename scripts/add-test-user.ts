/**
 * @file: add-test-user.ts
 * @description: Скрипт для добавления тестового пользователя с telegramId
 * @project: SaaS Bonus System
 * @dependencies: Prisma, @/lib/db
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { db } from '../src/lib/db';

async function addTestUser() {
  try {
    const projectId = 'cmdkloj85000cv8o0611rblp3';

    // Проверяем, существует ли проект
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      console.error('❌ Проект не найден');
      return;
    }

    console.log('✅ Проект найден:', project.name);

    // Создаем тестового пользователя с telegramId
    const testUser = await db.user.create({
      data: {
        projectId,
        email: 'test2@example.com',
        phone: '+79001234568',
        firstName: 'Тестовый',
        lastName: 'Пользователь 2',
        telegramId: 987654321, // Тестовый telegramId
        telegramUsername: 'testuser2',
        isActive: true,
        referralCode: 'TEST456'
      }
    });

    console.log('✅ Тестовый пользователь создан:', {
      id: testUser.id,
      email: testUser.email,
      telegramId: testUser.telegramId,
      telegramUsername: testUser.telegramUsername
    });

    // Проверяем статистику
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

    console.log('📊 Статистика пользователей:');
    console.log(`   Всего пользователей: ${totalUsers}`);
    console.log(`   С telegramId: ${telegramUsers}`);
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await db.$disconnect();
  }
}

addTestUser();
