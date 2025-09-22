#!/usr/bin/env npx tsx

import { UserService, BonusService } from '../src/lib/services/user.service';
import { ProjectService } from '../src/lib/services/project.service';

async function testWebhookBonusSpending() {
  try {
    // Данные из webhook'а
    const webhookData = {
      Name: 'Михаил Иванович Сагалаев',
      Email: 'sagalaev.mikhail@yandex.ru',
      Phone: '+7 (962) 002-41-88',
      payment: {
        amount: '4280',
        orderid: '1564748188',
        promocode: 'GUPIL',
        subtotal: '5480',
        discount: '1200'
      },
      appliedBonuses: '1200'
    };

    console.log('🔍 Тестируем списание бонусов из webhook');

    // Найдем пользователя
    const user = await UserService.findUserByContact(
      'cmfcb42zr0001v8hsk17ou4x9', // projectId
      webhookData.Email,
      webhookData.Phone
    );

    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }

    console.log(`✅ Пользователь найден: ${user.id}`);

    // Проверим баланс до списания
    const balanceBefore = await UserService.getUserBalance(user.id);
    console.log(`💰 Баланс до списания: ${balanceBefore.currentBalance}`);

    // Проверим условия для списания
    const promo = webhookData.payment.promocode;
    const isGupilPromo =
      typeof promo === 'string' && promo.trim().toUpperCase() === 'GUPIL';
    const appliedRaw = webhookData.appliedBonuses;
    const appliedRequested = Number(
      typeof appliedRaw === 'string'
        ? appliedRaw.replace(/[^0-9.\-]/g, '')
        : appliedRaw
    );

    console.log(
      `🎫 Промокод: ${promo} (${isGupilPromo ? 'GUPIL ✅' : 'не GUPIL ❌'})`
    );
    console.log(`💎 Заявленные бонусы: ${appliedRequested}`);

    if (
      isGupilPromo &&
      Number.isFinite(appliedRequested) &&
      appliedRequested > 0
    ) {
      // Ограничиваем суммой доступных бонусов
      const applied = Math.min(
        appliedRequested,
        Number(balanceBefore.currentBalance)
      );

      console.log(`💸 Списываем: ${applied} бонусов`);

      if (applied > 0) {
        const transactions = await BonusService.spendBonuses(
          user.id,
          applied,
          `Списание бонусов при заказе ${webhookData.payment.orderid} (промокод GUPIL)`,
          {
            orderId: webhookData.payment.orderid,
            source: 'tilda_order',
            promocode: 'GUPIL',
            originalApplied: appliedRequested
          }
        );

        console.log(`✅ Создано транзакций: ${transactions.length}`);
        for (const tx of transactions) {
          console.log(
            `  ${tx.id} | ${tx.type} | ${tx.amount} | ${tx.description}`
          );
        }

        // Проверим баланс после списания
        const balanceAfter = await UserService.getUserBalance(user.id);
        console.log(`💰 Баланс после списания: ${balanceAfter.currentBalance}`);

        // Проверим историю транзакций
        const { transactions: history } = await UserService.getUserTransactions(
          user.id,
          1,
          3
        );
        console.log(`\n📜 Последние 3 транзакции:`);
        for (const tx of history) {
          console.log(
            `  ${tx.createdAt} | ${tx.type} | ${tx.amount} | ${tx.description}`
          );
        }
      } else {
        console.log('❌ Нечего списывать - баланс равен нулю');
      }
    } else {
      console.log('❌ Условия для списания не выполнены');
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

testWebhookBonusSpending();
