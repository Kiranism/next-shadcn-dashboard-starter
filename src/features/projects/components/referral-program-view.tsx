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
  Download,
  Bot,
  AlertCircle
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
import { ReferralCommissionPlansPanel } from './referral-commission-plans-panel';
import type { Project, ReferralProgram } from '@/types/bonus';
import { getReferralLinkExample } from '@/lib/utils/referral-link';

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

  // Заглушка для режима WITHOUT_BOT
  if (project?.operationMode === 'WITHOUT_BOT') {
    return (
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <Heading
              title={`Реферальная программа: ${project?.name || 'Проект'}`}
              description='Настройка и статистика привлечения новых пользователей'
            />
          </div>
          <Badge variant='secondary'>Недоступно</Badge>
        </div>

        <Separator />

        {/* Заглушка */}
        <Card className='border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-yellow-700 dark:text-yellow-300'>
              <AlertCircle className='h-5 w-5' />
              Реферальная программа недоступна
            </CardTitle>
            <CardDescription className='text-yellow-600 dark:text-yellow-400'>
              Для использования реферальной программы необходим Telegram бот
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-sm text-yellow-700 dark:text-yellow-300'>
              <p className='mb-3'>
                Реферальная программа работает только в режиме{' '}
                <strong>"С Telegram ботом"</strong>, так как требует:
              </p>
              <ul className='list-inside list-disc space-y-1 pl-4'>
                <li>Генерацию персональных реферальных ссылок</li>
                <li>Уведомления о приглашённых пользователях</li>
                <li>Интерфейс для получения реферальной ссылки</li>
                <li>Отслеживание активности рефералов</li>
              </ul>
            </div>

            <div className='flex flex-col gap-3 pt-4 sm:flex-row'>
              <Button
                onClick={() =>
                  router.push(`/dashboard/projects/${projectId}/settings`)
                }
                className='flex items-center gap-2'
              >
                <Bot className='h-4 w-4' />
                Включить Telegram бота
              </Button>
              <Button
                variant='outline'
                onClick={() => router.push(`/dashboard/projects/${projectId}`)}
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Вернуться к проекту
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Дополнительная информация */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Альтернативы для привлечения пользователей
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='text-muted-foreground text-sm'>
              <p className='mb-3'>
                В режиме "Без Telegram бота" вы можете использовать другие
                способы привлечения пользователей:
              </p>
              <ul className='list-inside list-disc space-y-1 pl-4'>
                <li>UTM-метки для отслеживания источников трафика</li>
                <li>Промокоды и скидки для новых пользователей</li>
                <li>Email рассылки с персональными предложениями</li>
                <li>Интеграция с внешними партнёрскими программами</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Heading
            title={`Реферальная программа: ${project?.name || 'Проект'}`}
            description='Настройка и статистика привлечения новых пользователей'
          />
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
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='settings' className='flex items-center'>
                <Settings className='mr-2 h-4 w-4' />
                Настройки
              </TabsTrigger>
              <TabsTrigger value='stats' className='flex items-center'>
                <BarChart3 className='mr-2 h-4 w-4' />
                Статистика
              </TabsTrigger>
              <TabsTrigger value='plans' className='flex items-center'>
                <Target className='mr-2 h-4 w-4' />
                Планы %
              </TabsTrigger>
            </TabsList>

            <TabsContent value='settings' className='space-y-6'>
              <ReferralSettingsForm
                projectId={projectId}
                referralProgram={referralProgram}
                project={project}
                onSuccess={handleSettingsUpdate}
              />
            </TabsContent>

            <TabsContent value='stats' className='space-y-6'>
              <ReferralStatsView projectId={projectId} />
            </TabsContent>

            <TabsContent value='plans' className='space-y-6'>
              <ReferralCommissionPlansPanel
                projectId={projectId}
                enablePartnerRoles={Boolean(project?.enablePartnerRoles)}
              />
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
                <label className='text-sm font-medium'>Бонус новому</label>
                <p className='text-muted-foreground text-sm'>
                  {referralProgram?.refereeBonus || 0}%
                </p>
              </div>
              <div>
                <label className='text-sm font-medium'>
                  Приветственное вознаграждение
                </label>
                <p className='text-muted-foreground text-sm'>
                  {referralProgram?.welcomeRewardType === 'DISCOUNT' ? (
                    <>
                      Скидка{' '}
                      {referralProgram?.firstPurchaseDiscountPercent || 0}% на
                      первую покупку
                    </>
                  ) : (
                    <>
                      {Number(
                        referralProgram?.welcomeBonus || 0
                      ).toLocaleString('ru-RU')}{' '}
                      бонусов
                    </>
                  )}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium'>Мин. сумма заказа</label>
                <p className='text-muted-foreground text-sm'>
                  {Number(
                    referralProgram?.minPurchaseAmount || 0
                  ).toLocaleString('ru-RU')}{' '}
                  руб.
                </p>
              </div>
              <div>
                <label className='text-sm font-medium'>Отслеживание</label>
                <p className='text-muted-foreground text-sm'>
                  {referralProgram?.cookieLifetime || 0} дней
                </p>
              </div>
              <div>
                <label className='text-sm font-medium'>Уровни</label>
                <div className='mt-2 space-y-2'>
                  {(referralProgram?.levels || []).length > 0 ? (
                    referralProgram?.levels
                      ?.slice()
                      .sort((a, b) => a.level - b.level)
                      .map((level) => (
                        <div
                          key={level.id}
                          className='flex items-center justify-between rounded border px-2 py-1 text-sm'
                        >
                          <span>Уровень {level.level}</span>
                          <span className='font-semibold'>
                            {Number(level.percent)}%
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      Уровни не настроены
                    </p>
                  )}
                </div>
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
                  {getReferralLinkExample(project?.domain)}
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
