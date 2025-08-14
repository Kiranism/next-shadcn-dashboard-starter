/**
 * @file: test-notification-specific.ts
 * @description: Скрипт для тестирования рассылки конкретным пользователям
 * @project: SaaS Bonus System
 * @dependencies: fetch
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

async function testNotificationSpecific() {
  try {
    const projectId = 'cmdkloj85000cv8o0611rblp3';

    console.log('🧪 Тестирование рассылки конкретным пользователям...');

    // ID тестового пользователя, которого мы создали
    const userIds = ['cme01k6pv0001v8nwgz62sxma'];

    const payload = {
      message: '🧪 Тестовое сообщение конкретному пользователю!',
      imageUrl: undefined,
      buttons: undefined,
      parseMode: 'Markdown',
      userIds: userIds
    };

    console.log('📤 Отправка запроса...');
    console.log('User IDs:', userIds);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(
      `http://localhost:5006/api/projects/${projectId}/notifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    console.log('📥 Ответ сервера:');
    console.log('Status:', response.status);
    console.log('Result:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Рассылка выполнена успешно!');
    } else {
      console.log('❌ Ошибка рассылки');
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

testNotificationSpecific();
