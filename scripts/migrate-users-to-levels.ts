/**
 * @file: scripts/migrate-users-to-levels.ts
 * @description: Скрипт миграции пользователей на многоуровневую систему бонусов
 * @project: SaaS Bonus System
 * @dependencies: Prisma, BonusLevelService
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { PrismaClient } from '@prisma/client';
import { BonusLevelService } from '../src/lib/services/bonus-level.service';
import { logger } from '../src/lib/logger';

const db = new PrismaClient();

interface MigrationStats {
  totalUsers: number;
  updatedUsers: number;
  createdLevels: number;
  errors: number;
  projects: string[];
}

async function migrateUsersToLevels(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalUsers: 0,
    updatedUsers: 0,
    createdLevels: 0,
    errors: 0,
    projects: []
  };

  try {
    console.log(
      '🚀 Начинаем миграцию пользователей на многоуровневую систему бонусов...\n'
    );

    // Получаем все проекты
    const projects = await db.project.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    console.log(`📊 Найдено проектов: ${projects.length}`);

    for (const project of projects) {
      console.log(`\n🔄 Обрабатываем проект: ${project.name} (${project.id})`);
      console.log(`   Пользователей в проекте: ${project._count.users}`);

      stats.projects.push(project.name);

      try {
        // 1. Создаем уровни бонусов по умолчанию для проекта (если их еще нет)
        const existingLevels = await db.bonusLevel.count({
          where: { projectId: project.id }
        });

        if (existingLevels === 0) {
          console.log(`   📝 Создаем уровни бонусов по умолчанию...`);
          await BonusLevelService.createDefaultLevels(project.id);
          stats.createdLevels += 3; // Базовый, Серебряный, Золотой
          console.log(`   ✅ Создано 3 уровня бонусов`);
        } else {
          console.log(
            `   ℹ️  Уровни бонусов уже существуют (${existingLevels})`
          );
        }

        // 2. Получаем всех пользователей проекта, которым нужно обновить уровень
        const users = await db.user.findMany({
          where: {
            projectId: project.id,
            OR: [
              { currentLevel: null as any },
              { currentLevel: '' },
              { totalPurchases: { equals: null as any } }
            ]
          },
          include: {
            transactions: {
              where: { type: 'EARN' },
              select: { amount: true }
            }
          }
        });

        console.log(`   👥 Пользователей для обновления: ${users.length}`);
        stats.totalUsers += users.length;

        // 3. Обновляем каждого пользователя
        for (const user of users) {
          try {
            // Рассчитываем общую сумму покупок на основе транзакций EARN
            const totalPurchases = user.transactions.reduce(
              (sum, transaction) => sum + Number(transaction.amount),
              0
            );

            // Определяем текущий уровень
            const currentLevel = await BonusLevelService.calculateUserLevel(
              project.id,
              totalPurchases
            );

            // Обновляем пользователя
            await db.user.update({
              where: { id: user.id },
              data: {
                totalPurchases,
                currentLevel: currentLevel?.name || 'Базовый'
              }
            });

            stats.updatedUsers++;

            if (stats.updatedUsers % 10 === 0) {
              console.log(
                `   ⏳ Обновлено пользователей: ${stats.updatedUsers}`
              );
            }
          } catch (userError) {
            console.error(
              `   ❌ Ошибка обновления пользователя ${user.id}:`,
              userError
            );
            stats.errors++;
          }
        }

        console.log(
          `   ✅ Проект завершен. Обновлено: ${users.length} пользователей`
        );
      } catch (projectError) {
        console.error(
          `   ❌ Ошибка обработки проекта ${project.name}:`,
          projectError
        );
        stats.errors++;
      }
    }

    console.log('\n🎉 Миграция завершена!');
    console.log('\n📈 Статистика миграции:');
    console.log(`   • Всего пользователей обработано: ${stats.totalUsers}`);
    console.log(`   • Успешно обновлено: ${stats.updatedUsers}`);
    console.log(`   • Создано уровней бонусов: ${stats.createdLevels}`);
    console.log(`   • Ошибок: ${stats.errors}`);
    console.log(`   • Проектов обработано: ${stats.projects.length}`);
    console.log(`   • Проекты: ${stats.projects.join(', ')}`);

    return stats;
  } catch (error) {
    console.error('💥 Критическая ошибка миграции:', error);
    logger.error('Критическая ошибка миграции пользователей', {
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      component: 'migration-script'
    });
    throw error;
  }
}

// Функция отката миграции
async function rollbackMigration(): Promise<void> {
  console.log('🔄 Запуск отката миграции...\n');

  try {
    // Сбрасываем уровни пользователей на null
    const result = await db.user.updateMany({
      data: {
        currentLevel: null as any,
        totalPurchases: 0
      }
    });

    console.log(`✅ Откат завершен. Сброшено: ${result.count} пользователей`);
  } catch (error) {
    console.error('❌ Ошибка отката:', error);
    throw error;
  }
}

// Проверка целостности данных после миграции
async function validateMigration(): Promise<boolean> {
  console.log('🔍 Проверка целостности данных после миграции...\n');

  try {
    // Проверяем, что у всех пользователей есть уровень
    const usersWithoutLevel = await db.user.count({
      where: {
        OR: [{ currentLevel: null as any }, { currentLevel: '' }]
      }
    });

    // Проверяем, что у всех проектов есть уровни бонусов
    const projectsWithoutLevels = await db.project.count({
      where: {
        bonusLevels: {
          none: {}
        }
      }
    });

    console.log(`📊 Пользователей без уровня: ${usersWithoutLevel}`);
    console.log(`📊 Проектов без уровней бонусов: ${projectsWithoutLevels}`);

    const isValid = usersWithoutLevel === 0 && projectsWithoutLevels === 0;

    if (isValid) {
      console.log('✅ Проверка целостности пройдена успешно!');
    } else {
      console.log('❌ Обнаружены проблемы с целостностью данных!');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Ошибка проверки целостности:', error);
    return false;
  }
}

// Главная функция для запуска миграции
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    await db.$connect();
    console.log('🔗 Подключение к базе данных установлено\n');

    switch (command) {
      case 'migrate':
        const stats = await migrateUsersToLevels();
        await validateMigration();
        break;

      case 'rollback':
        await rollbackMigration();
        break;

      case 'validate':
        await validateMigration();
        break;

      default:
        console.log('🚀 Доступные команды:');
        console.log('   • migrate  - Выполнить миграцию пользователей');
        console.log('   • rollback - Откатить миграцию');
        console.log('   • validate - Проверить целостность данных');
        console.log('\nПример: npm run migrate-users migrate');
        break;
    }
  } catch (error) {
    console.error('💥 Ошибка выполнения:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
    console.log('\n🔌 Соединение с базой данных закрыто');
  }
}

// Запуск только если файл вызван напрямую
if (require.main === module) {
  main();
}

export { migrateUsersToLevels, rollbackMigration, validateMigration };
