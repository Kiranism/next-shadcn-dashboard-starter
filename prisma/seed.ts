/**
 * @file: prisma/seed.ts
 * @description: Главный seed файл для заполнения базы данных начальными данными
 * @project: SaaS Bonus System
 * @created: 2025-01-30
 * @author: AI Assistant
 */

import { PrismaClient } from '@prisma/client';
import { SUBSCRIPTION_PLANS_SEED } from './seeds/subscription-plans.seed';

const prisma = new PrismaClient();

/**
 * Seed тарифных планов (upsert — синхронизация лимитов с кодом)
 */
async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...');

  for (const planData of SUBSCRIPTION_PLANS_SEED) {
    const plan = await prisma.subscriptionPlan.upsert({
      where: { slug: planData.slug },
      create: {
        ...planData,
        features: planData.features as unknown as object
      },
      update: {
        name: planData.name,
        description: planData.description,
        price: planData.price,
        currency: planData.currency,
        interval: planData.interval,
        maxProjects: planData.maxProjects,
        maxUsersPerProject: planData.maxUsersPerProject,
        maxBots: planData.maxBots,
        maxNotifications: planData.maxNotifications,
        features: planData.features as unknown as object,
        isPublic: planData.isPublic,
        sortOrder: planData.sortOrder
      }
    });

    console.log(`  ✅ Synced plan: ${plan.name} (${plan.slug})`);
  }

  console.log('✅ Subscription plans seeded!');
}

/**
 * Создание бесплатных подписок для всех существующих администраторов
 */
async function seedAdminSubscriptions() {
  console.log('🌱 Creating free subscriptions for existing admins...');

  // Получаем Free план
  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { slug: 'free' }
  });

  if (!freePlan) {
    console.log('  ⚠️  Free plan not found, skipping admin subscriptions...');
    return;
  }

  // Получаем всех администраторов без активных подписок
  const admins = await prisma.adminAccount.findMany({
    where: {
      subscriptions: {
        none: {
          status: 'active'
        }
      }
    }
  });

  console.log(
    `  📊 Found ${admins.length} admins without active subscriptions`
  );

  let created = 0;
  for (const admin of admins) {
    // Проверяем, нет ли уже подписки (даже неактивной)
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        adminAccountId: admin.id,
        planId: freePlan.id
      }
    });

    if (existingSubscription) {
      console.log(
        `  ⏭️  Admin ${admin.email || admin.id} already has a subscription, skipping...`
      );
      continue;
    }

    // Создаем бесплатную подписку
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 100); // 100 лет вперед = "бессрочная"

    await prisma.subscription.create({
      data: {
        adminAccountId: admin.id,
        planId: freePlan.id,
        status: 'active',
        startDate,
        endDate
      }
    });

    created++;
    console.log(
      `  ✅ Created free subscription for admin: ${admin.email || admin.id}`
    );
  }

  console.log(`✅ Created ${created} free subscriptions for admins!`);
}

/**
 * Главная функция seed
 */
async function main() {
  console.log('🚀 Starting database seed...\n');

  try {
    // 1. Создаем тарифные планы
    await seedSubscriptionPlans();
    console.log('');

    // 2. Создаем бесплатные подписки для администраторов
    await seedAdminSubscriptions();
    console.log('');

    console.log('✅ Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
