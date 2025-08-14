/**
 * @file: check-user.ts
 * @description: Скрипт для проверки конкретного пользователя
 * @project: SaaS Bonus System
 * @dependencies: Prisma, @/lib/db
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { db } from '../src/lib/db';

async function checkUser() {
  try {
    const userId = 'cme01k6pv0001v8nwgz62sxma';

    console.log('🔍 Проверка пользователя:', userId);

    // Проверяем пользователя
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.error('❌ Пользователь не найден');
      return;
    }

    console.log('✅ Пользователь найден:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Phone:', user.phone);
    console.log('   First Name:', user.firstName);
    console.log('   Last Name:', user.lastName);
    console.log('   Telegram ID:', user.telegramId);
    console.log('   Telegram Username:', user.telegramUsername);
    console.log('   Is Active:', user.isActive);
    console.log('   Project ID:', user.projectId);

    // Проверяем, есть ли другие пользователи с telegramId
    const telegramUsers = await db.user.findMany({
      where: {
        projectId: user.projectId,
        telegramId: { not: null },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        telegramId: true,
        telegramUsername: true
      }
    });

    console.log('📱 Все пользователи с telegramId в проекте:');
    telegramUsers.forEach((u) => {
      console.log(`   - ${u.id}: ${u.email} (${u.telegramId})`);
    });
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await db.$disconnect();
  }
}

checkUser();
