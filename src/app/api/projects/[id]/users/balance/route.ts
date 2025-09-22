/**
 * @file: route.ts
 * @description: API для получения баланса пользователя по email/телефону (для интеграции с Tilda)
 * @project: SaaS Bonus System
 * @dependencies: NextRequest, NextResponse, UserService
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
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
        const h = new URL(originToCheck).hostname
          .replace(/^www\./i, '')
          .toLowerCase();
        // allow exact host or any subdomain of the allowed host
        return h === allowedHost || h.endsWith('.' + allowedHost);
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
    const user = await UserService.findUserByContact(
      projectId,
      email || undefined,
      phone || undefined
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Пользователь не найден',
          balance: 0,
          user: null
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Получаем баланс пользователя
    const userBalance = await UserService.getUserBalance(user.id);

    logger.info('User balance retrieved', {
      projectId,
      userId: user.id,
      email: user.email,
      phone: user.phone,
      balance: userBalance.currentBalance
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
          currentLevel: user.currentLevel
        },
        balanceDetails: {
          currentBalance: Number(userBalance.currentBalance),
          totalEarned: Number(userBalance.totalEarned),
          totalSpent: Number(userBalance.totalSpent),
          expiringSoon: Number(userBalance.expiringSoon)
        }
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const { id: projectId } = await context.params;
    logger.error('Error retrieving user balance', {
      projectId,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });

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
