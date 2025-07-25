/**
 * @file: src/features/projects/components/project-analytics-view.tsx
 * @description: Компонент аналитики и статистики проекта
 * @project: SaaS Bonus System
 * @dependencies: React, Charts, UI components
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  Gift,
  TrendingUp,
  Activity,
  AlertTriangle,
  BarChart3,
  PieChart,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import type { Project } from '@/types/bonus';
import type { ProjectAnalytics } from '@/types/analytics';

interface ProjectAnalyticsViewProps {
  projectId: string;
}

const chartColors = {
  primary: '#0ea5e9',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
};

export function ProjectAnalyticsView({ projectId }: ProjectAnalyticsViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем проект и аналитику параллельно
      const [projectResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/analytics`)
      ]);

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      // TODO: логгер
      console.error('Ошибка загрузки аналитики:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные аналитики',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Форматирование чисел
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Данные для pie chart транзакций
  const transactionPieData = analytics?.charts.transactionTypes.map((type, index) => ({
    name: type.type === 'EARN' ? 'Начисления' : 'Списания',
    value: type.count,
    amount: type.amount,
    fill: index === 0 ? chartColors.success : chartColors.danger
  })) || [];

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Нет данных для аналитики</h3>
          <p className="text-muted-foreground">
            Данные аналитики появятся после активности пользователей
          </p>
        </div>
      </div>
    );
  }

  const { overview } = analytics;

  return (
    <div className="flex flex-1 flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к проектам
          </Button>
          <div>
            <Heading
              title={`Аналитика: ${project?.name || 'Проект'}`}
              description="Статистика и аналитические данные проекта"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>Активных: {overview.activeUsers}</span>
              <Badge variant="outline" className="text-xs">
                +{overview.newUsersLast7Days} за неделю
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего бонусов</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview.totalBonuses)}₽</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>Активных: {formatNumber(overview.activeBonuses)}₽</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Транзакции</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalTransactions}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+{overview.transactionsLast7Days} за неделю</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Истекающие бонусы</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatNumber(overview.expiringBonuses.amount)}₽
            </div>
            <div className="text-xs text-muted-foreground">
              {overview.expiringBonuses.count} бонусов
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Активность по дням</span>
            </CardTitle>
            <CardDescription>
              Количество транзакций за последние 30 дней
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                earned: {
                  label: 'Начисления',
                  color: chartColors.success,
                },
                spent: {
                  label: 'Списания',
                  color: chartColors.danger,
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.charts.dailyActivity}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="earnedTransactions" 
                    stackId="1"
                    stroke={chartColors.success} 
                    fill={chartColors.success}
                    fillOpacity={0.6}
                    name="Начисления"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="spentTransactions" 
                    stackId="1"
                    stroke={chartColors.danger} 
                    fill={chartColors.danger}
                    fillOpacity={0.6}
                    name="Списания"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Transaction Types Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Распределение транзакций</span>
            </CardTitle>
            <CardDescription>
              Соотношение начислений и списаний
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                earned: {
                  label: 'Начисления',
                  color: chartColors.success,
                },
                spent: {
                  label: 'Списания',
                  color: chartColors.danger,
                },
              }}
              className="h-[300px]"
            >
                             <ResponsiveContainer width="100%" height="100%">
                 <RechartsPieChart>
                   <Pie
                     data={transactionPieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={100}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {transactionPieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.fill} />
                     ))}
                   </Pie>
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <div className="font-medium">{data.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Количество: {data.value}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Сумма: {formatNumber(data.amount)}₽
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Топ активных пользователей</span>
          </CardTitle>
          <CardDescription>
            Самые активные пользователи за последние 30 дней
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Пока нет активных пользователей
              </div>
            ) : (
              analytics.topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-primary">#{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.contact}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4 text-sm">
                      <div>
                        <div className="font-medium">{user.transactionCount}</div>
                        <div className="text-muted-foreground">транзакций</div>
                      </div>
                      <div>
                        <div className="font-medium text-green-600">
                          +{formatNumber(user.totalEarned)}₽
                        </div>
                        <div className="text-muted-foreground">начислено</div>
                      </div>
                      <div>
                        <div className="font-medium text-red-600">
                          -{formatNumber(user.totalSpent)}₽
                        </div>
                        <div className="text-muted-foreground">потрачено</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 