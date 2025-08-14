/**
 * @file: test-notification.ts
 * @description: Скрипт для тестирования рассылки
 * @project: SaaS Bonus System
 * @dependencies: fetch
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

async function testNotification() {
  try {
    const projectId = 'cmdkloj85000cv8o0611rblp3';

    console.log('🧪 Тестирование рассылки...');

    const payload = {
      message:
        '🧪 Тестовое сообщение от системы! Это проверка работы рассылок.',
      imageUrl: undefined,
      buttons: undefined,
      parseMode: 'Markdown',
      userIds: [] // Пустой массив = всем пользователям
    };

    console.log('📤 Отправка запроса...');
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

testNotification();
