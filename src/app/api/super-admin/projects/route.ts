/**
 * @file: src/app/api/super-admin/projects/route.ts
 * @description: API для управления проектами (список для супер-админки)
 * @project: SaaS Bonus System
 * @dependencies: Prisma
 * @created: 2025-01-30
 * @author: AI Assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const where: Prisma.ProjectWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [rows, total] = await Promise.all([
      db.project.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          domain: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          bonusPercentage: true,
          bonusExpiryDays: true,
          bonusBehavior: true,
          bonusMode: true,
          operationMode: true,
          welcomeBonus: true,
          welcomeRewardType: true,
          firstPurchaseDiscountPercent: true,
          maxPaymentPercentage: true,
          widgetVersion: true,
          botStatus: true,
          workflowMaxSteps: true,
          workflowTimeoutMs: true,
          owner: {
            select: {
              id: true,
              email: true
            }
          },
          botSettings: {
            select: {
              isActive: true
            }
          },
          inSalesIntegration: { select: { id: true } },
          moySkladIntegration: { select: { id: true } },
          moySkladDirectIntegration: { select: { id: true } },
          retailCrmIntegration: { select: { id: true } },
          _count: {
            select: {
              users: true
            }
          }
        }
      }),
      db.project.count({ where })
    ]);

    return NextResponse.json({
      projects: rows.map((p) => ({
        id: p.id,
        name: p.name,
        domain: p.domain,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        usersCount: p._count.users,
        botActive: p.botSettings?.isActive ?? false,
        bonusPercentage: p.bonusPercentage.toString(),
        bonusExpiryDays: p.bonusExpiryDays,
        bonusBehavior: p.bonusBehavior,
        bonusMode: p.bonusMode,
        operationMode: p.operationMode,
        welcomeBonus: p.welcomeBonus.toString(),
        welcomeRewardType: p.welcomeRewardType,
        firstPurchaseDiscountPercent: p.firstPurchaseDiscountPercent,
        maxPaymentPercentage: p.maxPaymentPercentage.toString(),
        widgetVersion: p.widgetVersion,
        botStatus: p.botStatus,
        workflowMaxSteps: p.workflowMaxSteps,
        workflowTimeoutMs: p.workflowTimeoutMs,
        owner: p.owner,
        integrations: {
          inSales: Boolean(p.inSalesIntegration),
          moySklad: Boolean(
            p.moySkladIntegration || p.moySkladDirectIntegration
          ),
          retailCrm: Boolean(p.retailCrmIntegration)
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
