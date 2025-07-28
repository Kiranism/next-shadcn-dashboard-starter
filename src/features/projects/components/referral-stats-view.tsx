/**
 * @file: src/features/projects/components/referral-stats-view.tsx
 * @description: Компонент статистики реферальной программы
 * @project: SaaS Bonus System
 * @dependencies: React, Shadcn/ui
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Gift,
  TrendingUp,
  Calendar,
  Download,
  ExternalLink,
  Star,
  Award,
  Target
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { ReferralStats } from '@/types/bonus';

interface ReferralStatsViewProps {
  projectId: string;
}

type TimePeriod = 'all' | 'month' | 'week';

export function ReferralStatsView({ projectId }: ReferralStatsViewProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('month');

  const loadStats = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/projects/${projectId}/referral-program/stats?period=${period}`
      );
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      } else {
        throw new Error('Ошибка загрузки статистики');
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить статистику',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [projectId, period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const exportStats = async () => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/referral-program/stats/export?period=${period}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `referral-stats-${period}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось экспортировать статистику',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-32 rounded bg-gray-200'></div>
            ))}
          </div>
          <div className='h-64 rounded bg-gray-200'></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <Target className='mb-4 h-16 w-16 text-gray-400' />
        <h3 className='mb-2 text-lg font-semibold'>Статистика недоступна</h3>
        <p className='text-center text-gray-600'>
          Не удалось загрузить данные статистики реферальной программы
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Controls */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Select
            value={period}
            onValueChange={(value: TimePeriod) => setPeriod(value)}
          >
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Выберите период' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Всё время</SelectItem>
              <SelectItem value='month'>Последний месяц</SelectItem>
              <SelectItem value='week'>Последняя неделя</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant='outline' onClick={exportStats}>
          <Download className='mr-2 h-4 w-4' />
          Экспорт
        </Button>
      </div>

      {/* Main Stats */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Всего рефералов
            </CardTitle>
            <Users className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalReferrals}</div>
            {period !== 'all' && (
              <p className='text-muted-foreground text-xs'>
                +{stats.periodReferrals} за период
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Выплачено бонусов
            </CardTitle>
            <Gift className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(stats.totalBonusPaid)}
            </div>
            {period !== 'all' && (
              <p className='text-muted-foreground text-xs'>
                +{formatCurrency(stats.periodBonusPaid)} за период
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Активных рефереров
            </CardTitle>
            <Star className='h-4 w-4 text-purple-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.activeReferrers}</div>
            <p className='text-muted-foreground text-xs'>с рефералами</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Средний чек</CardTitle>
            <TrendingUp className='h-4 w-4 text-orange-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(stats.averageOrderValue)}
            </div>
            <p className='text-muted-foreground text-xs'>от рефералов</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle>Топ рефереров</CardTitle>
          <CardDescription>
            Пользователи с наибольшим количеством приведённых рефералов
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topReferrers.length > 0 ? (
            <div className='space-y-4'>
              {stats.topReferrers.map((referrer, index) => (
                <div
                  key={referrer.id}
                  className='flex items-center justify-between rounded-lg border p-3'
                >
                  <div className='flex items-center space-x-3'>
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      {index + 1}
                    </Badge>
                    <div>
                      <p className='font-medium'>
                        {referrer.firstName} {referrer.lastName}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {referrer.email || referrer.phone}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold'>
                      {referrer.referralCount} рефералов
                    </p>
                    <p className='text-sm text-gray-600'>
                      {formatCurrency(referrer.totalBonus)} бонусов
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='py-8 text-center'>
              <Award className='mx-auto mb-3 h-12 w-12 text-gray-400' />
              <p className='text-gray-600'>Пока нет активных рефереров</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* UTM Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Источники трафика</CardTitle>
          <CardDescription>
            Анализ UTM меток по количеству приведённых пользователей
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.utmSources.length > 0 ? (
            <div className='space-y-3'>
              {stats.utmSources.map((source) => (
                <div
                  key={source.utm_source || 'unknown'}
                  className='flex items-center justify-between rounded-lg border p-3'
                >
                  <div>
                    <p className='font-medium'>
                      {source.utm_source || 'Не указан'}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {source.utm_medium ? `Medium: ${source.utm_medium}` : ''}
                      {source.utm_campaign
                        ? ` • Campaign: ${source.utm_campaign}`
                        : ''}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold'>{source.count} рефералов</p>
                    <div className='mt-1 h-2 w-24 rounded-full bg-gray-200'>
                      <div
                        className='h-2 rounded-full bg-blue-600'
                        style={{
                          width: `${(source.count / Math.max(...stats.utmSources.map((s) => s.count))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='py-8 text-center'>
              <ExternalLink className='mx-auto mb-3 h-12 w-12 text-gray-400' />
              <p className='text-gray-600'>Нет данных по UTM источникам</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
