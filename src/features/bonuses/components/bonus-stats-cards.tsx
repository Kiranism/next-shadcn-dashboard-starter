/**
 * @file: bonus-stats-cards.tsx
 * @description: Компонент карточек статистики бонусной системы
 * @project: SaaS Bonus System
 * @dependencies: react, ui components, icons
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Coins,
  TrendingUp,
  AlertTriangle,
  Activity,
  Target
} from 'lucide-react';

interface BonusStats {
  totalUsers: number;
  activeUsers: number;
  totalBonuses: number;
  pendingBonuses?: number;
  expiringSoonBonuses?: number;
  averageBonusPerUser?: number;
  conversionRate?: number;
  monthlyGrowth?: number;
}

interface BonusStatsCardsProps {
  stats: BonusStats;
  isLoading?: boolean;
  error?: string | null;
}

interface StatCard {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ElementType;
  variant: 'default' | 'success' | 'warning' | 'destructive';
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export const BonusStatsCards = memo<BonusStatsCardsProps>(
  ({ stats, isLoading = false, error = null }) => {
    // Вычисляем производные метрики
    const conversionRate =
      stats.totalUsers > 0
        ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
        : 0;

    const averageBonusPerUser =
      stats.totalUsers > 0
        ? Math.round(stats.totalBonuses / stats.totalUsers)
        : 0;

    const expiringSoonPercentage =
      stats.totalBonuses > 0 && stats.expiringSoonBonuses
        ? Math.round((stats.expiringSoonBonuses / stats.totalBonuses) * 100)
        : 0;

    // Определяем карточки статистики
    const statCards: StatCard[] = [
      {
        title: 'Всего пользователей',
        value: stats.totalUsers.toLocaleString('ru-RU'),
        subtitle: `${stats.activeUsers} активных`,
        trend: stats.monthlyGrowth
          ? {
              value: stats.monthlyGrowth,
              isPositive: stats.monthlyGrowth > 0
            }
          : undefined,
        icon: Users,
        variant: 'default',
        badge:
          stats.activeUsers > 0
            ? {
                text: `${conversionRate}% активность`,
                variant: conversionRate > 50 ? 'default' : 'secondary'
              }
            : undefined
      },
      {
        title: 'Общий баланс бонусов',
        value: `${stats.totalBonuses.toLocaleString('ru-RU')}₽`,
        subtitle:
          averageBonusPerUser > 0
            ? `${averageBonusPerUser}₽ на пользователя`
            : undefined,
        icon: Coins,
        variant: 'success'
      },
      {
        title: 'Активные пользователи',
        value: stats.activeUsers.toLocaleString('ru-RU'),
        subtitle:
          stats.totalUsers > 0
            ? `${conversionRate}% от общего числа`
            : undefined,
        icon: Activity,
        variant: stats.activeUsers > 0 ? 'default' : 'warning',
        badge: {
          text:
            conversionRate > 70
              ? 'Отлично'
              : conversionRate > 40
                ? 'Хорошо'
                : 'Низкая активность',
          variant:
            conversionRate > 70
              ? 'default'
              : conversionRate > 40
                ? 'secondary'
                : 'destructive'
        }
      },
      {
        title: 'Скоро истекут',
        value: stats.expiringSoonBonuses?.toLocaleString('ru-RU') || '0',
        subtitle: stats.expiringSoonBonuses
          ? `${expiringSoonPercentage}% от общего баланса`
          : 'Нет истекающих бонусов',
        icon: AlertTriangle,
        variant:
          expiringSoonPercentage > 20
            ? 'destructive'
            : expiringSoonPercentage > 10
              ? 'warning'
              : 'default',
        badge: stats.expiringSoonBonuses
          ? {
              text:
                expiringSoonPercentage > 20
                  ? 'Критично'
                  : expiringSoonPercentage > 10
                    ? 'Внимание'
                    : 'Норма',
              variant:
                expiringSoonPercentage > 20
                  ? 'destructive'
                  : expiringSoonPercentage > 10
                    ? 'outline'
                    : 'secondary'
            }
          : undefined
      }
    ];

    if (error) {
      return (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='border-destructive'>
            <CardContent className='p-6'>
              <div className='text-destructive flex items-center space-x-2'>
                <AlertTriangle className='h-4 w-4' />
                <span className='text-sm font-medium'>
                  Ошибка загрузки статистики
                </span>
              </div>
              <p className='text-muted-foreground mt-2 text-xs'>{error}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {statCards.map((card, index) => (
          <StatCard key={`stat-${index}`} card={card} isLoading={isLoading} />
        ))}
      </div>
    );
  }
);

BonusStatsCards.displayName = 'BonusStatsCards';

/**
 * Компонент отдельной карточки статистики
 */
interface StatCardProps {
  card: StatCard;
  isLoading: boolean;
}

const StatCard = memo<StatCardProps>(({ card, isLoading }) => {
  const Icon = card.icon;

  const getCardClassName = (variant: StatCard['variant']) => {
    const baseClasses = 'relative overflow-hidden';

    switch (variant) {
      case 'success':
        return `${baseClasses} border-green-200 bg-green-50/50`;
      case 'warning':
        return `${baseClasses} border-yellow-200 bg-yellow-50/50`;
      case 'destructive':
        return `${baseClasses} border-red-200 bg-red-50/50`;
      default:
        return baseClasses;
    }
  };

  const getIconClassName = (variant: StatCard['variant']) => {
    const baseClasses = 'h-4 w-4';

    switch (variant) {
      case 'success':
        return `${baseClasses} text-green-600`;
      case 'warning':
        return `${baseClasses} text-yellow-600`;
      case 'destructive':
        return `${baseClasses} text-red-600`;
      default:
        return `${baseClasses} text-muted-foreground`;
    }
  };

  if (isLoading) {
    return (
      <Card className='relative overflow-hidden'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <div className='bg-muted h-4 w-24 animate-pulse rounded' />
          <div className='bg-muted h-4 w-4 animate-pulse rounded' />
        </CardHeader>
        <CardContent>
          <div className='bg-muted mb-1 h-8 w-16 animate-pulse rounded' />
          <div className='bg-muted h-3 w-32 animate-pulse rounded' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={getCardClassName(card.variant)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>
          {card.title}
        </CardTitle>
        <Icon className={getIconClassName(card.variant)} />
      </CardHeader>
      <CardContent>
        <div className='flex items-end justify-between'>
          <div className='flex-1'>
            <div className='mb-1 text-2xl leading-none font-bold'>
              {card.value}
            </div>
            {card.subtitle && (
              <p className='text-muted-foreground text-xs'>{card.subtitle}</p>
            )}
          </div>

          <div className='flex flex-col items-end space-y-1'>
            {card.badge && (
              <Badge variant={card.badge.variant} className='text-xs'>
                {card.badge.text}
              </Badge>
            )}

            {card.trend && (
              <div
                className={`flex items-center text-xs ${
                  card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <TrendingUp
                  className={`mr-1 h-3 w-3 ${
                    !card.trend.isPositive ? 'rotate-180' : ''
                  }`}
                />
                {Math.abs(card.trend.value)}%
              </div>
            )}
          </div>
        </div>

        {/* Декоративная полоса для индикации варианта */}
        {card.variant !== 'default' && (
          <div
            className={`absolute right-0 bottom-0 left-0 h-1 ${
              card.variant === 'success'
                ? 'bg-green-500'
                : card.variant === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          />
        )}
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export default BonusStatsCards;
