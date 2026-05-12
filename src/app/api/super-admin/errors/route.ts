/**
 * @file: src/app/api/super-admin/errors/route.ts
 * @description: API для мониторинга системных ошибок и логов
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const level = searchParams.get('level') || '';
    const source = searchParams.get('source') || '';
    const projectId = searchParams.get('projectId') || '';

    const where: Prisma.SystemLogWhereInput = {};

    if (level) {
      where.level = level;
    }

    if (source) {
      where.source = source;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const [logs, total] = await Promise.all([
      db.systemLog.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      db.systemLog.count({ where })
    ]);

    // Статистика по уровням
    const stats = await db.systemLog.groupBy({
      by: ['level'],
      _count: {
        level: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Последние 24 часа
        }
      }
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: stats.reduce(
        (acc, stat) => {
          acc[stat.level] = stat._count.level;
          return acc;
        },
        {} as Record<string, number>
      )
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
