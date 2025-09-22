#!/usr/bin/env npx tsx

async function testWebhookEndpoint() {
  const webhookUrl = 'https://gupil.ru/api/webhook/cmfcb42zr0002v8hseaj6kyza';

  console.log(`🔍 Тестируем webhook endpoint: ${webhookUrl}`);

  // Тест 1: простой ping
  try {
    console.log('\n📡 Тест 1: Простой ping с test=1');

    const response1 = await fetch(`${webhookUrl}?test=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 1 })
    });

    console.log(`Статус: ${response1.status}`);
    console.log(
      `Headers: ${JSON.stringify(Object.fromEntries(response1.headers))}`
    );
    const text1 = await response1.text();
    console.log(`Ответ: ${text1}`);
  } catch (error) {
    console.error('Ошибка теста 1:', error);
  }

  // Тест 2: имитация Tilda webhook
  try {
    console.log('\n📡 Тест 2: Имитация Tilda webhook');

    const tildaData = {
      Name: 'Test User',
      Email: 'test@example.com',
      payment: {
        amount: '1000',
        orderid: 'test123',
        promocode: 'GUPIL'
      },
      appliedBonuses: '100'
    };

    const response2 = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tildaData)
    });

    console.log(`Статус: ${response2.status}`);
    const text2 = await response2.text();
    console.log(`Ответ: ${text2}`);
  } catch (error) {
    console.error('Ошибка теста 2:', error);
  }

  // Тест 3: form-data как Tilda
  try {
    console.log('\n📡 Тест 3: Form-data как Tilda');

    const formData = new FormData();
    formData.append(
      'data',
      JSON.stringify({
        Name: 'Test User',
        Email: 'test@example.com',
        payment: {
          amount: '1000',
          orderid: 'test456'
        }
      })
    );

    const response3 = await fetch(webhookUrl, {
      method: 'POST',
      body: formData
    });

    console.log(`Статус: ${response3.status}`);
    const text3 = await response3.text();
    console.log(`Ответ: ${text3}`);
  } catch (error) {
    console.error('Ошибка теста 3:', error);
  }
}

testWebhookEndpoint();
