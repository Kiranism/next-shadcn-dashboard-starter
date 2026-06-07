/**
 * @file: prisma/seeds/subscription-plans.seed.ts
 * @description: Seed данные для тарифных планов (upsert — синхронизация лимитов)
 * @project: SaaS Bonus System
 * @created: 2025-01-30
 * @updated: 2026-06-06
 * @author: AI Assistant
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SUBSCRIPTION_PLANS_SEED = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Для тестирования и небольших проектов',
    price: 0,
    currency: 'RUB',
    interval: 'month',
    maxProjects: 1,
    maxUsersPerProject: 10,
    maxBots: 1,
    maxNotifications: 1000,
    features: [
      '1 проект',
      '10 пользователей',
      '1 Telegram бот',
      'Email поддержка'
    ],
    isPublic: true,
    sortOrder: 1
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'Для растущих бизнесов',
    price: 2990,
    currency: 'RUB',
    interval: 'month',
    maxProjects: 5,
    maxUsersPerProject: 1000,
    maxBots: 5,
    maxNotifications: 10000,
    features: [
      '5 проектов',
      '1000 пользователей на проект',
      '5 Telegram ботов',
      'Аналитика',
      'Приоритетная поддержка'
    ],
    isPublic: true,
    sortOrder: 2
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Для крупных компаний',
    price: 9990,
    currency: 'RUB',
    interval: 'month',
    maxProjects: 10,
    maxUsersPerProject: 999999,
    maxBots: 10,
    maxNotifications: 0,
    features: [
      '10 проектов',
      'Безлимит пользователей',
      '10 Telegram ботов',
      'Кастомные интеграции',
      'Персональный менеджер',
      'SLA 99.9%'
    ],
    isPublic: true,
    sortOrder: 3
  }
] as const;

export async function seedSubscriptionPlans() {
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

if (require.main === module) {
  seedSubscriptionPlans()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
