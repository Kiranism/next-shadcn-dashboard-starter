/**
 * @file: test-webhook-integration.ts
 * @description: Скрипт для тестирования webhook интеграции
 * @project: SaaS Bonus System
 * @created: 2025-01-31
 */

import { ProjectService } from '@/lib/services/project.service';
import { UserService } from '@/lib/services/user.service';

async function testWebhookIntegration() {
  console.log('🧪 Тестирование webhook интеграции...\n');

  try {
    // 1. Получаем тестовый проект
    const projectsResult = await ProjectService.getProjects();
    if (projectsResult.projects.length === 0) {
      console.log(
        '❌ Нет проектов для тестирования. Создайте проект через админ-панель.'
      );
      return;
    }

    const testProject = projectsResult.projects[0];
    console.log(
      `📁 Используем проект: ${testProject.name} (ID: ${testProject.id})`
    );
    console.log(`🔑 Webhook Secret: ${testProject.webhookSecret}`);

    // 2. Формируем URL для webhook'а
    const webhookUrl = `${process.env.WEBHOOK_BASE_URL || 'http://localhost:3000'}/api/webhook/${testProject.webhookSecret}`;
    console.log(`🌐 Webhook URL: ${webhookUrl}\n`);

    // 3. Тестовые данные для разных типов webhook'ов
    const testCases = [
      {
        name: 'Регистрация пользователя',
        payload: {
          action: 'register_user',
          email: 'test@example.com',
          phone: '+7900123456789',
          firstName: 'Тестовый',
          lastName: 'Пользователь',
          utmSource: 'test',
          referralCode: 'TEST123'
        }
      },
      {
        name: 'Покупка с начислением бонусов',
        payload: {
          action: 'purchase',
          userEmail: 'test@example.com',
          purchaseAmount: 1000,
          orderId: 'TEST_ORDER_001',
          description: 'Тестовая покупка'
        }
      },
      {
        name: 'Списание бонусов',
        payload: {
          action: 'spend_bonuses',
          userEmail: 'test@example.com',
          bonusAmount: 50,
          orderId: 'TEST_SPEND_001',
          description: 'Тестовое списание'
        }
      },
      {
        name: 'Tilda заказ (имитация)',
        payload: [
          {
            name: 'Иван Иванов',
            email: 'ivan@example.com',
            phone: '+7900123456788',
            payment: {
              amount: '2000',
              orderid: 'TILDA_001',
              systranid: 'sys_001',
              products: [
                { name: 'Товар 1', price: 1500 },
                { name: 'Товар 2', price: 500 }
              ]
            },
            utm_ref: 'tilda_test'
          }
        ]
      }
    ];

    // 4. Выполняем тесты
    for (const testCase of testCases) {
      console.log(`🧪 Тест: ${testCase.name}`);
      console.log(`📤 Payload:`, JSON.stringify(testCase.payload, null, 2));

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Webhook-Test-Script'
          },
          body: JSON.stringify(testCase.payload)
        });

        const result = await response.text();

        if (response.ok) {
          console.log(`✅ Успех (${response.status}):`, result);
        } else {
          console.log(`❌ Ошибка (${response.status}):`, result);
        }
      } catch (error) {
        console.log(
          `❌ Ошибка запроса:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      console.log('─'.repeat(60));
    }

    // 5. Проверяем результаты в БД
    console.log('\n🔍 Проверка результатов в базе данных:');

    // Используем прямой запрос к БД
    const { db } = await import('@/lib/db');
    const users = await db.user.findMany({
      where: { projectId: testProject.id },
      take: 3,
      orderBy: { registeredAt: 'desc' }
    });

    console.log(`👥 Найдено пользователей: ${users.length}`);

    for (const user of users) {
      const balance = await UserService.getUserBalance(user.id);
      console.log(
        `  📊 ${user.firstName} ${user.lastName} (${user.email}): ${balance.currentBalance} бонусов`
      );
    }

    console.log('\n🎉 Тестирование завершено!');
    console.log('\n💡 Для продакшена используйте:');
    console.log(`   1. ngrok: npx ngrok http 3000`);
    console.log(`   2. Vercel: vercel --prod`);
    console.log(`   3. Docker: docker-compose up -d`);
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

// Запуск скрипта
if (require.main === module) {
  testWebhookIntegration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

export { testWebhookIntegration };
