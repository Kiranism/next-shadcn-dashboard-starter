/**
 * @file: src/app/api/projects/[id]/users/import/route.ts
 * @description: API endpoint для импорта пользователей из CSV
 * @project: SaaS Bonus System
 * @dependencies: Prisma, csv-parser
 * @created: 2025-12-02
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BonusType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { parse } from 'csv-parse/sync';
import { requireProjectAccess } from '@/lib/with-project-access';

interface CsvUser {
  Email?: string;
  email?: string;
  Name?: string;
  name?: string;
  Имя?: string;
  bonuses?: string;
  Bonuses?: string;
  'Количество бонусов'?: string;
  phone?: string;
  Phone?: string;
  Телефон?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: string | undefined;
}

interface ImportResult {
  success: boolean;
  stats: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  errors: string[];
}

// POST /api/projects/[id]/users/import
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ImportResult>> {
  const { id: projectId } = await params;

  const access = await requireProjectAccess(params);
  if (access instanceof NextResponse) {
    return access as NextResponse<ImportResult>;
  }

  try {
    // Проверка проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          stats: { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 },
          errors: ['Проект не найден']
        },
        { status: 404 }
      );
    }

    // Получение данных из формы
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const updateExisting = formData.get('updateExisting') === 'true';
    const bonusExpiryDays =
      parseInt(formData.get('bonusExpiryDays') as string) || 90;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          stats: { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 },
          errors: ['CSV файл не предоставлен']
        },
        { status: 400 }
      );
    }

    // Чтение CSV
    const csvText = await file.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true
    }) as CsvUser[];

    logger.info(
      `[Import] Начало импорта ${records.length} записей в проект ${projectId}`
    );

    const stats = {
      total: records.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
    const errors: string[] = [];

    // Обработка каждой записи
    for (const record of records) {
      try {
        const result = await importUser(
          record,
          projectId,
          updateExisting,
          bonusExpiryDays
        );
        if (result === 'created') stats.created++;
        else if (result === 'updated') stats.updated++;
        else if (result === 'skipped') stats.skipped++;
      } catch (error) {
        stats.errors++;
        const email = record.Email || record.email || 'unknown';
        errors.push(
          `Ошибка импорта ${email}: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }
    }

    logger.info(
      `[Import] Завершено: создано ${stats.created}, обновлено ${stats.updated}, пропущено ${stats.skipped}, ошибок ${stats.errors}`
    );

    return NextResponse.json({
      success: true,
      stats,
      errors: errors.slice(0, 50) // Ограничиваем количество ошибок в ответе
    });
  } catch (error) {
    logger.error('[Import] Критическая ошибка:', error);
    return NextResponse.json(
      {
        success: false,
        stats: { total: 0, created: 0, updated: 0, skipped: 0, errors: 1 },
        errors: [error instanceof Error ? error.message : 'Неизвестная ошибка']
      },
      { status: 500 }
    );
  }
}

async function importUser(
  record: CsvUser,
  projectId: string,
  updateExisting: boolean,
  bonusExpiryDays: number
): Promise<'created' | 'updated' | 'skipped'> {
  // Извлечение данных
  const email =
    (record.Email || record.email || '').toLowerCase().trim() || null;
  const phone = normalizePhone(record.phone || record.Phone || record.Телефон);

  // Имя
  let firstName =
    record.Name || record.name || record.Имя || record.firstName || '';
  let lastName = record.lastName || '';
  if (firstName.includes(' ')) {
    const parts = firstName.split(' ');
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  }

  // Бонусы
  const bonusesStr =
    record.bonuses || record.Bonuses || record['Количество бонусов'] || '0';
  const bonuses = parseNumber(bonusesStr);

  // Валидация
  if (!email && !phone) {
    return 'skipped';
  }

  // Поиск существующего пользователя
  let existingUser = null;
  if (email) {
    existingUser = await db.user.findFirst({
      where: { projectId, email }
    });
  }
  if (!existingUser && phone) {
    existingUser = await db.user.findFirst({
      where: { projectId, phone }
    });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + bonusExpiryDays);

  if (existingUser) {
    if (!updateExisting) {
      return 'skipped';
    }

    // Обновление существующего пользователя
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: firstName.trim() || existingUser.firstName,
          lastName: lastName.trim() || existingUser.lastName,
          phone: phone || existingUser.phone
        }
      });

      // Добавляем бонусы если нужно
      if (bonuses > 0) {
        const currentBonuses = await tx.bonus.aggregate({
          where: { userId: existingUser.id, isUsed: false },
          _sum: { amount: true }
        });

        const currentBalance = Number(currentBonuses._sum.amount || 0);
        const diff = bonuses - currentBalance;

        if (diff > 0) {
          await tx.bonus.create({
            data: {
              userId: existingUser.id,
              amount: diff,
              type: BonusType.MANUAL,
              description: 'Корректировка баланса при импорте из CSV',
              expiresAt,
              metadata: {
                migration: true,
                source: 'csv_import_api',
                previousBalance: currentBalance,
                newBalance: bonuses
              }
            }
          });

          await tx.transaction.create({
            data: {
              userId: existingUser.id,
              amount: diff,
              type: 'EARN',
              description: 'Корректировка баланса при импорте из CSV',
              metadata: { migration: true, source: 'csv_import_api' }
            }
          });
        }
      }
    });

    return 'updated';
  }

  // Создание нового пользователя
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        projectId,
        email,
        phone,
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        isActive: true,
        currentLevel: 'Базовый',
        totalPurchases: 0,
        referralCode: generateReferralCode(email, phone)
      }
    });

    if (bonuses > 0) {
      await tx.bonus.create({
        data: {
          userId: user.id,
          amount: bonuses,
          type: BonusType.MANUAL,
          description: 'Импорт из CSV',
          expiresAt,
          metadata: {
            migration: true,
            source: 'csv_import_api',
            importDate: new Date().toISOString()
          }
        }
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: bonuses,
          type: 'EARN',
          description: 'Импорт бонусов из CSV',
          userLevel: 'Базовый',
          metadata: { migration: true, source: 'csv_import_api' }
        }
      });
    }
  });

  return 'created';
}

function normalizePhone(phone?: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return null;

  if (cleaned.startsWith('7') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('8') && cleaned.length === 11) {
    return `+7${cleaned.slice(1)}`;
  }
  if (cleaned.length === 10) {
    return `+7${cleaned}`;
  }
  return phone;
}

function parseNumber(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

function generateReferralCode(
  email: string | null,
  phone: string | null
): string {
  const base = email
    ? email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 8)
    : phone?.replace(/\D/g, '').slice(-6) || 'user';
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}_${random}`.toUpperCase();
}
