/**
 * @file: scripts/fix-duplicate-subscriptions.ts
 * @description: Чинит ситуацию когда у админа несколько одновременно активных
 *               подписок (например, старая Free + новая Pro/Enterprise после
 *               апгрейда). Оставляет самую щедрую активную подписку (наибольший
 *               `plan.maxProjects`), остальные помечает `status = 'cancelled'`
 *               и проставляет `endDate = NOW()` если он не задан.
 *
 *               Идемпотентно: повторный запуск ничего не делает, если у
 *               каждого админа ровно 1 активная подписка.
 * @project: SaaS Bonus System
 * @dependencies: Prisma, @/lib/db
 * @created: 2026-05-27
 * @author: AI Assistant + User
 *
 * Usage:
 *   npx tsx scripts/fix-duplicate-subscriptions.ts            # реальный прогон
 *   npx tsx scripts/fix-duplicate-subscriptions.ts --dry-run  # без записи
 *   npx tsx scripts/fix-duplicate-subscriptions.ts --adminId=<id>  # точечно
 */

import { db } from '../src/lib/db';

interface Args {
  dryRun: boolean;
  adminId?: string;
  help: boolean;
}

function parseArgs(): Args {
  const args: Args = { dryRun: false, help: false };
  for (const raw of process.argv.slice(2)) {
    if (raw === '--help' || raw === '-h') args.help = true;
    else if (raw === '--dry-run') args.dryRun = true;
    else if (raw.startsWith('--adminId=')) args.adminId = raw.split('=')[1];
    else {
      console.error(`❌ Неизвестный аргумент: ${raw}`);
      process.exit(1);
    }
  }
  return args;
}

function printHelp() {
  console.log(`
🔧 fix-duplicate-subscriptions — устранение дубликатов активных подписок

При апгрейде с Free на платный план могла создаться новая подписка, а
старая Free не была отменена. В таком случае BillingService.getActiveSubscription
возвращал случайный результат (часто Free), и админ упирался в лимит
"1/1 проектов" даже на Enterprise.

Скрипт оставляет самую щедрую подписку (по plan.maxProjects DESC, потом
по startDate DESC) и переводит остальные в status='cancelled'.

Аргументы:
  --dry-run            Только показать что будет сделано
  --adminId=<id>       Обработать только одного админа
  --help, -h           Эта справка
`);
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    printHelp();
    return;
  }

  console.log('🔧 fix-duplicate-subscriptions');
  console.log('Параметры:', {
    adminId: args.adminId ?? '(все)',
    dryRun: args.dryRun
  });

  const where = args.adminId ? { id: args.adminId } : {};
  const admins = await db.adminAccount.findMany({
    where,
    select: { id: true, email: true }
  });

  console.log(`\nОбрабатываем ${admins.length} админов...\n`);

  let totalFixed = 0;
  let totalDuplicates = 0;

  for (const admin of admins) {
    const activeSubs = await db.subscription.findMany({
      where: {
        adminAccountId: admin.id,
        status: 'active',
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }]
      },
      include: { plan: true },
      orderBy: [{ plan: { maxProjects: 'desc' } }, { startDate: 'desc' }]
    });

    if (activeSubs.length <= 1) continue;

    totalDuplicates += activeSubs.length - 1;
    const keep = activeSubs[0];
    const toCancel = activeSubs.slice(1);

    console.log(
      `👤 ${admin.email} (${admin.id}): ${activeSubs.length} активных подписок`
    );
    console.log(
      `   ✅ Оставляем: ${keep.plan.name} (slug=${keep.plan.slug}, maxProjects=${keep.plan.maxProjects}, startDate=${keep.startDate.toISOString()})`
    );
    for (const sub of toCancel) {
      console.log(
        `   ❌ Отменяем:   ${sub.plan.name} (slug=${sub.plan.slug}, maxProjects=${sub.plan.maxProjects}, startDate=${sub.startDate.toISOString()})`
      );
    }

    if (args.dryRun) continue;

    const now = new Date();
    await db.$transaction(
      toCancel.map((sub) =>
        db.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'cancelled',
            endDate: sub.endDate ?? now,
            cancelledAt: sub.cancelledAt ?? now
          }
        })
      )
    );
    totalFixed += toCancel.length;
  }

  console.log(
    `\n📊 Итого: найдено ${totalDuplicates} дубликатов, ${args.dryRun ? 'было бы исправлено' : 'исправлено'} ${totalFixed}.`
  );
  console.log('\n✅ Готово');
}

main()
  .catch((err) => {
    console.error('❌ Ошибка:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
