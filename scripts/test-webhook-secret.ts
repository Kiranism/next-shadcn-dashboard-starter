#!/usr/bin/env npx tsx

import { ProjectService } from '../src/lib/services/project.service';
import { db } from '../src/lib/db';

async function testWebhookSecret() {
  try {
    const secret = 'cmfcb42zr0002v8hseaj6kyza';
    console.log(`🔍 Тестируем webhook secret: ${secret}`);

    // Прямой запрос к БД
    console.log('\n📋 Прямой запрос к БД:');
    const directProject = await db.project.findFirst({
      where: { webhookSecret: secret }
    });

    if (directProject) {
      console.log(
        `✅ Найден проект: ${directProject.name} (${directProject.id})`
      );
      console.log(`   Активен: ${directProject.isActive}`);
      console.log(`   WebhookSecret: ${directProject.webhookSecret}`);
    } else {
      console.log('❌ Проект не найден в БД');
    }

    // Через ProjectService
    console.log('\n🔧 Через ProjectService:');
    const serviceProject =
      await ProjectService.getProjectByWebhookSecret(secret);

    if (serviceProject) {
      console.log(
        `✅ Найден проект: ${serviceProject.name} (${serviceProject.id})`
      );
      console.log(`   Активен: ${serviceProject.isActive}`);
    } else {
      console.log('❌ Проект не найден через ProjectService');
    }

    // Все проекты для сравнения
    console.log('\n📊 Все проекты:');
    const allProjects = await db.project.findMany({
      select: {
        id: true,
        name: true,
        webhookSecret: true,
        isActive: true
      }
    });

    for (const project of allProjects) {
      console.log(
        `  ${project.name}: ${project.webhookSecret} (${project.isActive ? 'активен' : 'неактивен'})`
      );
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await db.$disconnect();
  }
}

testWebhookSecret();
