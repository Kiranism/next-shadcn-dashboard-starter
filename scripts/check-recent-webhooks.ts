#!/usr/bin/env npx tsx

import { db } from '../src/lib/db';

async function checkRecentWebhooks() {
  try {
    console.log('🔍 Проверяем последние webhook запросы');

    // Проверяем последние 10 webhook логов
    const logs = await db.webhookLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        project: true
      }
    });

    if (logs.length === 0) {
      console.log('❌ Webhook логов вообще не найдено');
    } else {
      console.log(`✅ Найдено логов: ${logs.length}`);

      for (const log of logs) {
        console.log(`\n📋 Лог ${log.id}:`);
        console.log(`  Время: ${log.createdAt}`);
        console.log(`  Проект: ${log.project?.name} (${log.projectId})`);
        console.log(`  Статус: ${log.status} ${log.success ? '✅' : '❌'}`);
        console.log(`  Method: ${log.method}`);
        console.log(`  Endpoint: ${log.endpoint}`);

        if (log.body) {
          const body = log.body as any;
          console.log(`  Email: ${body?.Email || body?.email || 'нет'}`);
          console.log(
            `  Промокод: ${body?.payment?.promocode || body?.promocode || 'нет'}`
          );
          console.log(`  appliedBonuses: ${body?.appliedBonuses || 'нет'}`);
          console.log(
            `  OrderID: ${body?.payment?.orderid || body?.orderid || 'нет'}`
          );

          // Покажем первые 300 символов тела запроса
          const bodyStr = JSON.stringify(body);
          console.log(
            `  Body (первые 300 символов): ${bodyStr.substring(0, 300)}${bodyStr.length > 300 ? '...' : ''}`
          );
        }

        if (log.response) {
          const respStr = JSON.stringify(log.response);
          console.log(
            `  Response (первые 200 символов): ${respStr.substring(0, 200)}${respStr.length > 200 ? '...' : ''}`
          );
        }
      }
    }

    // Проверяем webhook secrets проектов
    console.log('\n🔑 Webhook secrets проектов:');
    const projects = await db.project.findMany({
      select: {
        id: true,
        name: true,
        webhookSecret: true,
        isActive: true
      }
    });

    for (const project of projects) {
      console.log(
        `  ${project.name}: https://gupil.ru/api/webhook/${project.webhookSecret} (${project.isActive ? 'активен' : 'неактивен'})`
      );
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await db.$disconnect();
  }
}

checkRecentWebhooks();
