#!/usr/bin/env npx tsx

import { db } from '../src/lib/db';

async function checkWebhookLogs() {
  try {
    console.log('🔍 Проверяем логи webhook для заказа 1564748188');

    // Проверяем логи webhook
    const logs = await db.webhookLog.findMany({
      where: {
        OR: [
          { body: { path: ['payment', 'orderid'], equals: '1564748188' } },
          { body: { path: ['orderid'], equals: '1564748188' } },
          { response: { path: ['order', 'id'], equals: '1564748188' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (logs.length === 0) {
      console.log('❌ Логи webhook для заказа 1564748188 не найдены');
    } else {
      console.log(`✅ Найдено логов: ${logs.length}`);

      for (const log of logs) {
        console.log(`\n📋 Лог ${log.id}:`);
        console.log(`  Время: ${log.createdAt}`);
        console.log(`  Проект: ${log.projectId}`);
        console.log(`  Статус: ${log.status} ${log.success ? '✅' : '❌'}`);
        console.log(`  Endpoint: ${log.endpoint}`);

        if (log.body) {
          const body = log.body as any;
          console.log(
            `  Промокод: ${body?.payment?.promocode || body?.promocode || 'нет'}`
          );
          console.log(`  appliedBonuses: ${body?.appliedBonuses || 'нет'}`);
          console.log(`  Email: ${body?.Email || body?.email || 'нет'}`);
        }

        if (log.response) {
          console.log(
            `  Ответ: ${JSON.stringify(log.response).substring(0, 200)}...`
          );
        }

        // errorMessage нет в схеме, можно убрать
      }
    }

    // Проверяем транзакции пользователя с этим orderid
    console.log('\n🔍 Проверяем транзакции с orderid 1564748188');

    const transactions = await db.transaction.findMany({
      where: {
        OR: [
          { description: { contains: '1564748188' } },
          { metadata: { path: ['orderId'], equals: '1564748188' } }
        ]
      },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (transactions.length === 0) {
      console.log('❌ Транзакций с orderid 1564748188 не найдено');
    } else {
      console.log(`✅ Найдено транзакций: ${transactions.length}`);

      for (const tx of transactions) {
        console.log(`\n💰 Транзакция ${tx.id}:`);
        console.log(`  Время: ${tx.createdAt}`);
        console.log(`  Пользователь: ${tx.user?.email}`);
        console.log(`  Тип: ${tx.type}`);
        console.log(`  Сумма: ${tx.amount}`);
        console.log(`  Описание: ${tx.description}`);
        if (tx.metadata) {
          console.log(`  Metadata: ${JSON.stringify(tx.metadata)}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await db.$disconnect();
  }
}

checkWebhookLogs();
