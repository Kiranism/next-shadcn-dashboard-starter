/**
 * @file: route.ts
 * @description: API для получения баланса пользователя по email/телефону (для интеграции с Tilda)
 * @project: SaaS Bonus System
 * @dependencies: NextRequest, NextResponse, UserService
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

import { type NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { ProjectService } from '@/lib/services/project.service';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    // Domain allow-list based on project.domain
    const originHeader = request.headers.get('origin') || '';
    const refererHeader = request.headers.get('referer') || '';
    const originToCheck =
      originHeader || (refererHeader ? new URL(refererHeader).origin : '');

    const project = await ProjectService.getProjectById(projectId);
    const allowedHost = String(project?.domain || '')
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/.*/, '')
      .toLowerCase();

    const isAllowed = (() => {
      if (!allowedHost) return true; // fallback: no domain configured → allow
      if (!originToCheck) return false;
      try {
        const hostname = new URL(originToCheck).hostname;
        const normalizedHost = hostname.replace(/^www\./i, '').toLowerCase();
        // allow exact host or any subdomain of the allowed host
        return (
          normalizedHost === allowedHost ||
          normalizedHost.endsWith('.' + allowedHost)
        );
      } catch {
        return false;
      }
    })();

    const corsHeaders =
      isAllowed && originToCheck
        ? {
            'Access-Control-Allow-Origin': originToCheck,
            'Access-Control-Allow-Credentials': 'true',
            Vary: 'Origin'
          }
        : undefined;

    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: 'Origin not allowed' },
        { status: 403 }
      );
    }
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const phone = url.searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Требуется email или phone параметр' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Находим пользователя
    let user = await UserService.findUserByContact(
      projectId,
      email || undefined,
      phone || undefined
    );

    if (!user && project?.operationMode === 'WITHOUT_BOT') {
      const firstName =
        url.searchParams.get('firstName') ||
        url.searchParams.get('name') ||
        undefined;
      const lastName = url.searchParams.get('lastName') || undefined;
      const utmSource = url.searchParams.get('utm_source') || undefined;
      const utmMedium = url.searchParams.get('utm_medium') || undefined;
      const utmCampaign = url.searchParams.get('utm_campaign') || undefined;
      const utmContent = url.searchParams.get('utm_content') || undefined;
      const utmTerm = url.searchParams.get('utm_term') || undefined;

      try {
        user = await UserService.createUser({
          projectId,
          email: email || undefined,
          phone: phone || undefined,
          firstName,
          lastName,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm
        });
        logger.info('Auto-registered user in WITHOUT_BOT mode', {
          projectId,
          email,
          phone,
          userId: user.id
        });
      } catch (createError) {
        logger.error('Failed to auto-register user in WITHOUT_BOT mode', {
          projectId,
          email,
          phone,
          error:
            createError instanceof Error
              ? createError.message
              : String(createError)
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: `Пользователь с ${email ? `email ${email}` : phone ? `телефоном ${phone}` : 'указанными данными'} не найден в системе бонусов`,
          balance: 0,
          user: null,
          details: {
            searchedBy: email ? 'email' : phone ? 'phone' : 'unknown',
            searchValue: email || phone || null
          }
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Получаем баланс пользователя
    const userBalance = await UserService.getUserBalance(user.id);

    // Получаем информацию об уровне пользователя для виджета
    const { BonusLevelService } = await import(
      '@/lib/services/bonus-level.service'
    );
    const currentLevel = await BonusLevelService.calculateUserLevel(
      projectId,
      Number(user.totalPurchases)
    );

    // Проверяем право на скидку первой покупки
    const { db } = await import('@/lib/db');
    const projectSettings = await db.project.findUnique({
      where: { id: projectId },
      select: {
        welcomeRewardType: true,
        firstPurchaseDiscountPercent: true
      }
    });

    const isFirstPurchase = Number(user.totalPurchases) === 0;
    const hasFirstPurchaseDiscount =
      isFirstPurchase &&
      projectSettings?.welcomeRewardType === 'DISCOUNT' &&
      Number(projectSettings?.firstPurchaseDiscountPercent || 0) > 0;

    const firstPurchaseDiscount = hasFirstPurchaseDiscount
      ? {
          available: true,
          discountPercent: Number(
            projectSettings?.firstPurchaseDiscountPercent || 0
          )
        }
      : {
          available: false,
          discountPercent: 0
        };

    logger.info('User balance retrieved', {
      projectId,
      userId: user.id,
      email: user.email,
      phone: user.phone,
      balance: userBalance.currentBalance,
      level: currentLevel?.name,
      firstPurchaseDiscount: firstPurchaseDiscount.available
        ? `${firstPurchaseDiscount.discountPercent}%`
        : 'none'
    });

    return NextResponse.json(
      {
        success: true,
        balance: Number(userBalance.currentBalance),
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          currentLevel: user.currentLevel,
          telegramLinked: Boolean(user.telegramId)
        },
        balanceDetails: {
          currentBalance: Number(userBalance.currentBalance),
          totalEarned: Number(userBalance.totalEarned),
          totalSpent: Number(userBalance.totalSpent),
          expiringSoon: Number(userBalance.expiringSoon)
        },
        levelInfo: currentLevel
          ? {
              name: currentLevel.name,
              bonusPercent: currentLevel.bonusPercent,
              paymentPercent: currentLevel.paymentPercent,
              minAmount: Number(currentLevel.minAmount),
              maxAmount: currentLevel.maxAmount
                ? Number(currentLevel.maxAmount)
                : null
            }
          : null,
        firstPurchaseDiscount
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    try {
      const { id: projectId } = await context.params;
      logger.error('Error retrieving user balance', {
        projectId,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        stack: error instanceof Error ? error.stack : undefined
      });
    } catch (paramsError) {
      logger.error('Error retrieving user balance (failed to get projectId)', {
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        paramsError:
          paramsError instanceof Error
            ? paramsError.message
            : String(paramsError)
      });
    }

    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        success: false,
        balance: 0
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const originHeader = request.headers.get('origin') || '';
    const refererHeader = request.headers.get('referer') || '';
    const originToCheck =
      originHeader || (refererHeader ? new URL(refererHeader).origin : '');
    const project = await ProjectService.getProjectById(projectId);
    const allowedHost = String(project?.domain || '')
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/.*/, '')
      .toLowerCase();
    let allow = false;
    try {
      const h = originToCheck
        ? new URL(originToCheck).hostname.replace(/^www\./i, '').toLowerCase()
        : '';
      allow =
        !allowedHost ||
        (h !== '' && (h === allowedHost || h.endsWith('.' + allowedHost)));
    } catch {
      allow = false;
    }
    const headers: Record<string, string> =
      allow && originToCheck
        ? {
            'Access-Control-Allow-Origin': originToCheck,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            Vary: 'Origin'
          }
        : { 'Access-Control-Allow-Origin': 'null' };
    return new NextResponse(null, { status: 204, headers });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
