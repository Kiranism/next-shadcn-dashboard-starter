import { NextRequest, NextResponse } from 'next/server';

interface AnalyticsData {
  projectId: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  charts: {
    userGrowth: Array<{ date: string; users: number }>;
    sessionAnalytics: Array<{
      date: string;
      sessions: number;
      duration: number;
    }>;
    topPages: Array<{ page: string; views: number; uniqueUsers: number }>;
  };
  revenue: {
    total: number;
    growth: number;
    transactions: number;
    averageOrderValue: number;
  };
}

// Генерация демо данных
function generateAnalyticsData(
  projectId: string,
  period: { start: string; end: string }
): AnalyticsData {
  const days = 30; // Последние 30 дней
  const baseUsers = 1000;
  const baseRevenue = 50000;

  return {
    projectId,
    period,
    metrics: {
      totalUsers: baseUsers + Math.floor(Math.random() * 500),
      activeUsers: Math.floor((baseUsers + Math.random() * 500) * 0.7),
      newUsers: Math.floor(Math.random() * 200) + 50,
      totalSessions: Math.floor((baseUsers + Math.random() * 500) * 2.5),
      averageSessionDuration: Math.floor(Math.random() * 300) + 120, // секунды
      bounceRate: Math.floor(Math.random() * 30) + 25, // проценты
      conversionRate: Math.floor(Math.random() * 10) + 2 // проценты
    },
    charts: {
      userGrowth: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        users: Math.floor(baseUsers * 0.8 + Math.random() * baseUsers * 0.4)
      })),
      sessionAnalytics: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        sessions: Math.floor(50 + Math.random() * 200),
        duration: Math.floor(120 + Math.random() * 400)
      })),
      topPages: [
        { page: '/dashboard', views: 15420, uniqueUsers: 8932 },
        { page: '/products', views: 12340, uniqueUsers: 7651 },
        { page: '/analytics', views: 9876, uniqueUsers: 5432 },
        { page: '/settings', views: 6543, uniqueUsers: 4321 },
        { page: '/profile', views: 4567, uniqueUsers: 3210 }
      ]
    },
    revenue: {
      total: baseRevenue + Math.floor(Math.random() * 20000),
      growth: Math.floor(Math.random() * 30) - 10, // -10% to +20%
      transactions: Math.floor(Math.random() * 500) + 200,
      averageOrderValue: Math.floor(Math.random() * 200) + 100
    }
  };
}

/**
 * GET /api/projects/[id]/analytics
 * Получить аналитику проекта
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);

    // Параметры запроса
    const startDate =
      searchParams.get('start') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('end') || new Date().toISOString();
    const metrics = searchParams.get('metrics')?.split(',') || ['all'];

    console.log('Analytics request:', {
      projectId,
      startDate,
      endDate,
      metrics
    });

    // Генерируем данные аналитики
    const analyticsData = generateAnalyticsData(projectId, {
      start: startDate,
      end: endDate
    });

    // Фильтруем данные по запрошенным метрикам
    let responseData: Partial<AnalyticsData> = { ...analyticsData };

    if (!metrics.includes('all')) {
      responseData = {
        projectId: analyticsData.projectId,
        period: analyticsData.period
      };

      if (metrics.includes('metrics')) {
        responseData.metrics = analyticsData.metrics;
      }

      if (metrics.includes('charts')) {
        responseData.charts = analyticsData.charts;
      }

      if (metrics.includes('revenue')) {
        responseData.revenue = analyticsData.revenue;
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      generated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/analytics
 * Отправить событие аналитики
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const event = {
      projectId,
      type: body.type || 'page_view',
      data: body.data || {},
      timestamp: new Date().toISOString(),
      userId: body.userId,
      sessionId: body.sessionId,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    };

    console.log('Analytics event:', event);

    // В реальном проекте здесь была бы запись в аналитическую БД

    return NextResponse.json({
      success: true,
      message: 'Event recorded successfully',
      eventId: `evt_${Date.now()}`
    });
  } catch (error) {
    console.error('Analytics event error:', error);
    return NextResponse.json(
      { error: 'Failed to record analytics event' },
      { status: 500 }
    );
  }
}
