/**
 * @file: src/app/api/projects/[id]/users/route.ts
 * @description: API для управления пользователями проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js API Routes, Prisma, UserService
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { UserService } from '@/lib/services/user.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const users = await db.user.findMany({
      where: { projectId: id },
      orderBy: { registeredAt: 'desc' }
    });

    // Форматируем данные для совместимости с UI
    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        // Получаем реальный баланс пользователя
        let userBalance = { currentBalance: 0, totalEarned: 0, totalSpent: 0 };
        try {
          userBalance = await UserService.getUserBalance(user.id);
        } catch (error) {
          logger.warn('Не удалось получить баланс пользователя', {
            userId: user.id,
            error
          });
        }

        return {
          id: user.id,
          name:
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            'Без имени',
          email: user.email,
          phone: user.phone,
          bonusBalance: Number(userBalance.currentBalance),
          totalEarned: Number(userBalance.totalEarned),
          createdAt: user.registeredAt,
          updatedAt: user.updatedAt,
          avatar: `https://api.slingacademy.com/public/sample-users/${Math.floor(Math.random() * 10) + 1}.png`,
          // Дополнительные поля для project-users-view
          firstName: user.firstName,
          lastName: user.lastName,
          birthDate: user.birthDate,
          registeredAt: user.registeredAt,
          totalBonuses: Number(userBalance.totalEarned),
          activeBonuses: Number(userBalance.currentBalance),
          lastActivity: user.updatedAt
        };
      })
    );

    return NextResponse.json(formattedUsers);
  } catch (error) {
    const { id } = await params;
    logger.error('Ошибка получения пользователей', { projectId: id, error });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем обязательные поля
    if (!body.email && !body.phone) {
      return NextResponse.json(
        { error: 'Необходимо указать email или телефон' },
        { status: 400 }
      );
    }

    // Проверяем уникальность email в рамках проекта
    if (body.email) {
      const existingUser = await db.user.findFirst({
        where: {
          projectId: id,
          email: body.email
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует' },
          { status: 409 }
        );
      }
    }

    // Проверяем уникальность телефона в рамках проекта
    if (body.phone) {
      const existingUser = await db.user.findFirst({
        where: {
          projectId: id,
          phone: body.phone
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Пользователь с таким телефоном уже существует' },
          { status: 409 }
        );
      }
    }

    // Создаем пользователя
    const newUser = await db.user.create({
      data: {
        projectId: id,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        email: body.email || null,
        phone: body.phone || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null
      }
    });

    // Форматируем пользователя для UI
    const formattedUser = {
      id: newUser.id,
      name:
        `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() ||
        newUser.email ||
        'Новый пользователь',
      email: newUser.email,
      phone: newUser.phone,
      avatar: `https://api.slingacademy.com/public/sample-users/${Math.floor(Math.random() * 5) + 1}.png`,
      bonusBalance: 0,
      totalEarned: 0,
      createdAt: newUser.registeredAt,
      updatedAt: newUser.updatedAt,
      // Дополнительные поля
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      birthDate: newUser.birthDate,
      registeredAt: newUser.registeredAt,
      totalBonuses: 0,
      activeBonuses: 0,
      lastActivity: newUser.updatedAt
    };

    logger.info('Пользователь создан', {
      projectId: id,
      userId: newUser.id,
      userEmail: newUser.email
    });

    return NextResponse.json(formattedUser, { status: 201 });
  } catch (error) {
    const { id } = await params;
    logger.error('Ошибка создания пользователя', { projectId: id, error });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { operation, userIds, data } = body;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    let results = [];

    switch (operation) {
      case 'bulk_bonus_award':
        // Массовое начисление бонусов
        for (const userId of userIds) {
          try {
            const bonus = await db.bonus.create({
              data: {
                userId,
                amount: data.amount,
                type: 'MANUAL',
                description: data.description || 'Массовое начисление бонусов',
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                isUsed: false
              }
            });

            // Создаем запись в истории транзакций
            await db.transaction.create({
              data: {
                userId,
                bonusId: bonus.id,
                amount: data.amount,
                type: 'EARN',
                description: data.description || 'Массовое начисление бонусов',
                userLevel: data.userLevel || null,
                appliedPercent: data.appliedPercent || null,
                isReferralBonus: false
              }
            });

            results.push({ userId, success: true, bonusId: bonus.id });
          } catch (error) {
            results.push({
              userId,
              success: false,
              error:
                error instanceof Error ? error.message : 'Неизвестная ошибка'
            });
          }
        }
        break;

      case 'bulk_bonus_deduct':
        // Массовое списание бонусов
        for (const userId of userIds) {
          try {
            // Получаем активные бонусы пользователя
            const activeBonus = await db.bonus.findFirst({
              where: {
                userId,
                isUsed: false,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
              },
              orderBy: { createdAt: 'asc' }
            });

            if (!activeBonus || Number(activeBonus.amount) < data.amount) {
              results.push({
                userId,
                success: false,
                error: 'Недостаточно бонусов для списания'
              });
              continue;
            }

            // Списываем бонусы
            const newAmount = Number(activeBonus.amount) - data.amount;
            if (newAmount <= 0) {
              await db.bonus.update({
                where: { id: activeBonus.id },
                data: { isUsed: true }
              });
            } else {
              await db.bonus.update({
                where: { id: activeBonus.id },
                data: { amount: newAmount }
              });
            }

            // Создаем запись в истории транзакций
            await db.transaction.create({
              data: {
                userId,
                bonusId: activeBonus.id,
                amount: data.amount,
                type: 'SPEND',
                description: data.description || 'Массовое списание бонусов'
              }
            });

            results.push({
              userId,
              success: true,
              deductedAmount: data.amount
            });
          } catch (error) {
            results.push({
              userId,
              success: false,
              error:
                error instanceof Error ? error.message : 'Неизвестная ошибка'
            });
          }
        }
        break;

      case 'bulk_notification':
        // Массовая отправка уведомлений через Telegram бота
        try {
          const { botManager } = await import('@/lib/telegram/bot-manager');
          const botInstance = botManager.getBot(projectId);

          if (!botInstance) {
            return NextResponse.json(
              { error: 'Бот для этого проекта не найден или неактивен' },
              { status: 400 }
            );
          }

          for (const userId of userIds) {
            try {
              const user = await db.user.findUnique({
                where: { id: userId }
              });

              if (user && user.telegramId) {
                await botInstance.bot.api.sendMessage(
                  user.telegramId.toString(),
                  data.message,
                  { parse_mode: 'Markdown' }
                );
                results.push({ userId, success: true });
              } else {
                results.push({
                  userId,
                  success: false,
                  error: 'Пользователь не привязан к Telegram'
                });
              }
            } catch (error) {
              results.push({
                userId,
                success: false,
                error:
                  error instanceof Error ? error.message : 'Ошибка отправки'
              });
            }
          }
        } catch (error) {
          return NextResponse.json(
            { error: 'Ошибка инициализации бота' },
            { status: 500 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Неизвестная операция' },
          { status: 400 }
        );
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Операция выполнена. Успешно: ${successCount}, с ошибками: ${failureCount}`,
      results,
      summary: {
        total: userIds.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error: any) {
    const { id: projectId } = await params;
    logger.error('Error in bulk user operations', {
      projectId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
