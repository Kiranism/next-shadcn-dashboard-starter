/**
 * @file: health/route.ts
 * @description: Health check endpoint для мониторинга системы
 * @project: SaaS Bonus System
 * @dependencies: Prisma, Logger
 * @created: 2025-08-09
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: 'healthy' | 'unhealthy';
    application: 'healthy' | 'unhealthy';
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Проверка базы данных
    let databaseStatus: 'healthy' | 'unhealthy' = 'unhealthy';
    try {
      await db.$queryRaw`SELECT 1`;
      databaseStatus = 'healthy';
    } catch (error) {
      logger.error('Database health check failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Информация о памяти
    const memoryUsage = process.memoryUsage();
    const memoryInfo = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round(
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      )
    };

    // Общий статус системы
    const isHealthy = databaseStatus === 'healthy';

    const healthStatus: HealthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: databaseStatus,
        application: 'healthy'
      },
      uptime: Math.floor(process.uptime()),
      memory: memoryInfo
    };

    const responseTime = Date.now() - startTime;

    // Логирование health check
    logger.info('Health check completed', {
      status: healthStatus.status,
      responseTime: `${responseTime}ms`,
      database: databaseStatus,
      memory: memoryInfo
    });

    return NextResponse.json(healthStatus, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`
      }
    });
  } catch (error) {
    logger.error('Health check endpoint error:', {
      error: error instanceof Error ? error.message : String(error)
    });

    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unhealthy',
        application: 'unhealthy'
      },
      uptime: Math.floor(process.uptime()),
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      }
    };

    return NextResponse.json(errorStatus, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}
