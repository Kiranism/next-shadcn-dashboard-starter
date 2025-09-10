/**
 * @file: src/features/projects/components/referral-program-view.tsx
 * @description: Компонент управления реферальной программой
 * @project: SaaS Bonus System
 * @dependencies: React, Shadcn/ui, React Hook Form
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
  Settings,
  BarChart3,
  Share2,
  Target,
  DollarSign,
  Eye,
  Calendar,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ReferralSettingsForm } from './referral-settings-form';
import { ReferralStatsView } from './referral-stats-view';
import type { Project, ReferralProgram } from '@/types/bonus';

interface ReferralProgramViewProps {
  projectId: string;
}

export function ReferralProgramView({ projectId }: ReferralProgramViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [referralProgram, setReferralProgram] =
    useState<ReferralProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('settings');

  const loadData = async () => {
    try {
      setLoading(true);

      // Load project
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
      }

      // Load referral program
      const referralResponse = await fetch(
        `/api/projects/${projectId}/referral-program`
      );
      if (referralResponse.ok) {
        const referralData = await referralResponse.json();
        // API может вернуть { success, data } или сам объект
        setReferralProgram(referralData?.data || referralData);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные проекта',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleSettingsUpdate = () => {
    loadData();
    toast({
      title: 'Успех',
      description: 'Настройки реферальной программы обновлены'
    });
  };

  if (loading) {
    return (
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 w-1/3 rounded bg-gray-200'></div>
          <div className='h-4 w-1/2 rounded bg-gray-200'></div>
          <div className='h-32 rounded bg-gray-200'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/dashboard/projects')}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Назад к проектам
          </Button>
          <div>
            <Heading
              title={`Реферальная программа: ${project?.name || 'Проект'}`}
              description='Настройка и статистика привлечения новых пользователей'
            />
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <Badge variant={referralProgram?.isActive ? 'default' : 'secondary'}>
            {referralProgram?.isActive ? 'Активна' : 'Неактивна'}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
        {/* Main content */}
        <div className='lg:col-span-3'>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='space-y-6'
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='settings' className='flex items-center'>
                <Settings className='mr-2 h-4 w-4' />
                Настройки
              </TabsTrigger>
              <TabsTrigger value='stats' className='flex items-center'>
                <BarChart3 className='mr-2 h-4 w-4' />
                Статистика
              </TabsTrigger>
            </TabsList>

            <TabsContent value='settings' className='space-y-6'>
              <ReferralSettingsForm
                projectId={projectId}
                referralProgram={referralProgram}
                onSuccess={handleSettingsUpdate}
              />
            </TabsContent>

            <TabsContent value='stats' className='space-y-6'>
              <ReferralStatsView projectId={projectId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Quick stats */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Краткая статистика</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Users className='h-4 w-4 text-blue-600' />
                  <span className='text-sm'>Всего рефералов</span>
                </div>
                <span className='font-semibold'>-</span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Gift className='h-4 w-4 text-green-600' />
                  <span className='text-sm'>Выплачено бонусов</span>
                </div>
                <span className='font-semibold'>-</span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <TrendingUp className='h-4 w-4 text-purple-600' />
                  <span className='text-sm'>За месяц</span>
                </div>
                <span className='font-semibold'>-</span>
              </div>
            </CardContent>
          </Card>

          {/* Program info */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>О программе</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <label className='text-sm font-medium'>Статус</label>
                <p className='text-muted-foreground text-sm'>
                  {referralProgram?.isActive ? 'Активна' : 'Неактивна'}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium'>Бонус рефереру</label>
                <p className='text-muted-foreground text-sm'>
                  {referralProgram?.referrerBonus || 0}%
                </p>
              </div>
              <div>
                <label className='text-sm font-medium'>Бонус новому</label>
                <p className='text-muted-foreground text-sm'>
                  {referralProgram?.refereeBonus || 0}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Как это работает</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <div className='flex items-start space-x-2'>
                <Share2 className='mt-0.5 h-4 w-4 shrink-0 text-blue-600' />
                <div>
                  <p className='font-medium'>UTM метки</p>
                  <p className='text-muted-foreground'>
                    Отслеживание по utm_source, utm_medium и utm_campaign
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-2'>
                <Target className='mt-0.5 h-4 w-4 shrink-0 text-green-600' />
                <div>
                  <p className='font-medium'>Автоматические бонусы</p>
                  <p className='text-muted-foreground'>
                    Начисление при регистрации и первой покупке
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-2'>
                <DollarSign className='mt-0.5 h-4 w-4 shrink-0 text-purple-600' />
                <div>
                  <p className='font-medium'>Минимальная сумма</p>
                  <p className='text-muted-foreground'>
                    Можно установить минимальную сумму покупки
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Обновленная справка по ссылке */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                Как выглядит реферальная ссылка
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <p className='text-muted-foreground text-sm'>
                Ссылка формируется в формате:{' '}
                <code className='text-xs'>
                  maoka.ru/?utm_ref=&lt;userId&gt;
                </code>
                . Параметры utm_source/utm_medium/utm_campaign больше не
                используются.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
