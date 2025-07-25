'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { useBonusStore } from '../stores/bonus-store';

interface BonusStatsCardsProps {
  isLoading?: boolean;
}

export function BonusStatsCards({ isLoading }: BonusStatsCardsProps) {
  const { stats } = useBonusStore();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Общее количество пользователей */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Пользователи
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Всего в системе
          </p>
        </CardContent>
      </Card>

      {/* Активные бонусы */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Активные бонусы
          </CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalActiveBonuses.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Средний баланс: {stats.averageBalance.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Заработано в этом месяце */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Заработано в месяце
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            +{stats.totalEarnedThisMonth.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Начислено пользователям
          </p>
        </CardContent>
      </Card>

      {/* Потрачено в этом месяце */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Потрачено в месяце
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            -{stats.totalSpentThisMonth.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Списано пользователями
          </p>
        </CardContent>
      </Card>

      {/* Дополнительные метрики */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Статистика месяца
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Истекло бонусов:</span>
            <Badge variant="destructive" className="font-mono">
              {stats.totalExpiredThisMonth.toLocaleString()}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Чистый прирост:</span>
            <Badge 
              variant={
                stats.totalEarnedThisMonth - stats.totalSpentThisMonth > 0 
                  ? "default" 
                  : "destructive"
              }
              className="font-mono"
            >
              {stats.totalEarnedThisMonth - stats.totalSpentThisMonth > 0 ? '+' : ''}
              {(stats.totalEarnedThisMonth - stats.totalSpentThisMonth).toLocaleString()}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Конверсия трат:</span>
            <Badge variant="outline" className="font-mono">
              {((stats.totalSpentThisMonth / stats.totalEarnedThisMonth) * 100).toFixed(1)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Предупреждения */}
      <Card className="md:col-span-2 lg:col-span-2 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Требует внимания
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700">Пользователи с нулевым балансом:</span>
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              1 пользователь
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700">Истекают в ближайшие 7 дней:</span>
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              750 бонусов
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700">Неактивные пользователи (30+ дней):</span>
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              0 пользователей
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}