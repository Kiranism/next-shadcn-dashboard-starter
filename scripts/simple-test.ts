/**
 * @file: simple-test.ts
 * @description: Простой тест рассылки
 * @project: SaaS Bonus System
 * @dependencies: fetch
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

async function simpleTest() {
  try {
    const projectId = 'cmdkloj85000cv8o0611rblp3';

    console.log('🧪 Простой тест рассылки...');

    const payload = {
      message: 'Тест рассылки!',
      userIds: []
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
      console.log('✅ Результат:', result);
    } else {
      console.log('❌ Ошибка HTTP:', response.status);
      const errorText = await response.text();
      console.log('Ошибка:', errorText);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

simpleTest();
