#!/usr/bin/env npx tsx

import { db } from '../src/lib/db';

async function findUserByEmail() {
  const email = process.argv[2];

  if (!email) {
    console.log('Usage: npx tsx scripts/find-user-by-email.ts <email>');
    process.exit(1);
  }

  try {
    console.log(`🔍 Поиск пользователя по email: ${email}`);

    const users = await db.user.findMany({
      where: {
        email: email
      },
      include: {
        project: true
      }
    });

    if (users.length === 0) {
      console.log('❌ Пользователь не найден');
    } else {
      console.log(`✅ Найдено пользователей: ${users.length}`);

      for (const user of users) {
        console.log(`\n📱 Пользователь:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Проект: ${user.project?.name} (${user.projectId})`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Phone: ${user.phone}`);
        console.log(`  Имя: ${user.firstName} ${user.lastName}`);
        console.log(`  Дата регистрации: ${user.registeredAt}`);
        console.log(`  Активен: ${user.isActive}`);
        console.log(`  Total purchases: ${user.totalPurchases}`);

        // Проверяем транзакции
        const transactions = await db.transaction.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            bonus: true
          }
        });

        console.log(`\n💰 Транзакции (последние 10):`);
        if (transactions.length === 0) {
          console.log('  ❌ Транзакций не найдено');
        } else {
          for (const tx of transactions) {
            console.log(
              `  ${tx.createdAt.toISOString()} | ${tx.type} | ${tx.amount} | ${tx.description}`
            );
            if (tx.metadata) {
              console.log(`    metadata: ${JSON.stringify(tx.metadata)}`);
            }
          }
        }

        // Проверяем бонусы
        const bonuses = await db.bonus.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10
        });

        console.log(`\n🎁 Бонусы (последние 10):`);
        if (bonuses.length === 0) {
          console.log('  ❌ Бонусов не найдено');
        } else {
          for (const bonus of bonuses) {
            console.log(
              `  ${bonus.createdAt.toISOString()} | ${bonus.type} | ${bonus.amount} | Used: ${bonus.isUsed} | Expires: ${bonus.expiresAt}`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await db.$disconnect();
  }
}

findUserByEmail();
