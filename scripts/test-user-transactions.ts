#!/usr/bin/env npx tsx

import { UserService } from '../src/lib/services/user.service';

async function testUserTransactions() {
  const userId = 'cmfcbtnbi0006v8hs8wv9kpmj';

  try {
    console.log(`🔍 Тестируем getUserTransactions для пользователя: ${userId}`);

    const result = await UserService.getUserTransactions(userId, 1, 10);

    console.log(`\n✅ Результат:`);
    console.log(`  Всего транзакций: ${result.total}`);
    console.log(`  Загружено: ${result.transactions.length}`);

    if (result.transactions.length > 0) {
      console.log(`\n💰 Транзакции:`);
      for (const tx of result.transactions) {
        console.log(
          `  ${tx.createdAt} | ${tx.type} | ${tx.amount} | ${tx.description}`
        );
      }
    } else {
      console.log(`\n❌ Транзакций не найдено`);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

testUserTransactions();
