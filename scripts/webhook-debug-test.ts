#!/usr/bin/env npx tsx

import { ProjectService } from '../src/lib/services/project.service';

async function webhookDebugTest() {
  try {
    console.log('🔍 Детальная отладка webhook');

    const webhookSecret = 'cmfcb42zr0002v8hseaj6kyza';
    const webhookUrl = `https://gupil.ru/api/webhook/${webhookSecret}`;

    console.log(`URL: ${webhookUrl}`);
    console.log(`Secret: ${webhookSecret}`);

    // Проверяем проект еще раз
    const project =
      await ProjectService.getProjectByWebhookSecret(webhookSecret);
    console.log(`Проект найден: ${project ? '✅' : '❌'}`);
    if (project) {
      console.log(`  ID: ${project.id}`);
      console.log(`  Название: ${project.name}`);
      console.log(`  Активен: ${project.isActive}`);
    }

    // Отправляем минимальный тест
    console.log('\n📡 Отправляем простейший тест...');

    const testPayload = { test: 1 };

    const response = await fetch(`${webhookUrl}?test=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TildaDebugTest/1.0'
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`\n📊 Результат:`);
    console.log(`Статус: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);

    const responseText = await response.text();
    console.log(`Тело ответа: ${responseText}`);

    // Попробуем с query-параметром test
    console.log('\n📡 Тест с query test=true...');
    const response2 = await fetch(`${webhookUrl}?test=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    console.log(`Статус: ${response2.status}`);
    const responseText2 = await response2.text();
    console.log(`Ответ: ${responseText2}`);
  } catch (error) {
    console.error('❌ Ошибка теста:', error);
  }
}

webhookDebugTest();
