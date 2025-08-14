/**
 * @file: test-specific-user.ts
 * @description: Тест отправки сообщения конкретному пользователю
 * @project: SaaS Bonus System
 * @dependencies: fetch
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

async function testSpecificUser() {
  try {
    const projectId = 'cmdkloj85000cv8o0611rblp3';
    const userId = 'cme01k6pv0001v8nwgz62sxma'; // Пользователь с telegramId: 987654321

    console.log('🧪 Тест отправки конкретному пользователю...');
    console.log(`👤 Пользователь: ${userId}`);

    const payload = {
      message: 'Тест сообщения конкретному пользователю!',
      userIds: [userId]
    };

    console.log('📤 Отправка запроса...');

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

    console.log('📥 Статус ответа:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Результат:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Ошибка:', errorText);
    }
  } catch (error) {
    console.log('❌ Ошибка:', error);
  }
}

testSpecificUser();
