/**
 * @file: src/features/projects/components/project-settings-view.tsx
 * @description: Компонент настроек проекта
 * @project: SaaS Bonus System
 * @dependencies: React, form handling
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bot,
  Users,
  BarChart3,
  Settings,
  Coins,
  Share2,
  Code,
  Workflow,
  Gift,
  Percent,
  Plug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { Project, WelcomeRewardType } from '@/types/bonus';
import { ProjectDeleteDialog } from './project-delete-dialog';
import {
  OperationModeSelector,
  type OperationMode
} from './operation-mode-selector';
import { OperationModeConfirmDialog } from './operation-mode-confirm-dialog';
import { BonusModeSelector } from './bonus-mode-selector';
import { B2bHierarchySettings } from './b2b-hierarchy-settings';
import {
  ProjectNotFoundState,
  type ProjectLoadError
} from './project-not-found-state';

interface ProjectSettingsViewProps {
  projectId: string;
  /** Clerk sub — для импорта workflow B2B из настроек. */
  adminSub?: string;
}

export function ProjectSettingsView({
  projectId,
  adminSub
}: ProjectSettingsViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [loadError, setLoadError] = useState<ProjectLoadError | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasLevels, setHasLevels] = useState(false);
  const [levelsCount, setLevelsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [showModeConfirmDialog, setShowModeConfirmDialog] = useState(false);
  const [pendingMode, setPendingMode] = useState<OperationMode | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    bonusPercentage: 1.0,
    bonusExpiryDays: 365,
    bonusBehavior: 'SPEND_AND_EARN' as
      | 'SPEND_AND_EARN'
      | 'SPEND_ONLY'
      | 'EARN_ONLY',
    bonusMode: 'SIMPLE' as 'SIMPLE' | 'LEVELS',
    operationMode: 'WITH_BOT' as OperationMode,
    isActive: true,
    welcomeBonusAmount: 0,
    welcomeRewardType: 'BONUS' as WelcomeRewardType,
    firstPurchaseDiscountPercent: 10,
    maxPaymentPercentage: 100
  });

  const loadProject = async () => {
    try {
      setLoading(true);

      // Загружаем проект, уровни и статистику параллельно
      const [projectResponse, levelsResponse, statsResponse] =
        await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/bonus-levels`),
          fetch(`/api/projects/${projectId}/stats`)
        ]);

      // Проверяем наличие уровней
      if (levelsResponse.ok) {
        const levelsJson = await levelsResponse.json();
        const levelsArray = levelsJson.data || levelsJson;
        if (Array.isArray(levelsArray)) {
          setHasLevels(levelsArray.length > 0);
          setLevelsCount(levelsArray.length);
        } else {
          setHasLevels(false);
          setLevelsCount(0);
        }
      }

      // Получаем количество пользователей
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUsersCount(statsData.totalUsers || 0);
      }

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setLoadError(null);
        setProject(projectData);
        setFormData({
          name: projectData.name || '',
          domain: projectData.domain || '',
          bonusPercentage: Number(projectData.bonusPercentage) || 1.0,
          bonusExpiryDays: projectData.bonusExpiryDays || 365,
          bonusBehavior: (projectData.bonusBehavior || 'SPEND_AND_EARN') as
            | 'SPEND_AND_EARN'
            | 'SPEND_ONLY'
            | 'EARN_ONLY',
          bonusMode: (projectData.bonusMode || 'SIMPLE') as 'SIMPLE' | 'LEVELS',
          operationMode: (projectData.operationMode ||
            'WITH_BOT') as OperationMode,
          isActive: projectData.isActive ?? true,
          welcomeBonusAmount: Number(projectData.welcomeBonus || 0),
          welcomeRewardType: (projectData.welcomeRewardType ||
            'BONUS') as WelcomeRewardType,
          firstPurchaseDiscountPercent:
            projectData.firstPurchaseDiscountPercent || 10,
          maxPaymentPercentage: Number(projectData.maxPaymentPercentage) || 100
        });
      } else if (projectResponse.status === 403) {
        setLoadError('forbidden');
      } else if (projectResponse.status === 404) {
        setLoadError('not_found');
      } else {
        setLoadError('error');
      }
    } catch (error) {
      console.error('Ошибка загрузки проекта:', error);
      setLoadError('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]); // Добавляем projectId в зависимости вместо loadProject

  // Отслеживание изменений формы
  useEffect(() => {
    if (!project) return;

    const hasChanges =
      formData.name !== (project.name || '') ||
      formData.domain !== (project.domain || '') ||
      formData.bonusPercentage !== Number(project.bonusPercentage || 1.0) ||
      formData.bonusExpiryDays !== (project.bonusExpiryDays || 365) ||
      formData.bonusMode !== (project.bonusMode || 'SIMPLE') ||
      formData.operationMode !== (project.operationMode || 'WITH_BOT') ||
      formData.isActive !== (project.isActive ?? true) ||
      formData.welcomeBonusAmount !== Number(project.welcomeBonus || 0) ||
      formData.welcomeRewardType !== (project.welcomeRewardType || 'BONUS') ||
      formData.firstPurchaseDiscountPercent !==
        (project.firstPurchaseDiscountPercent || 10) ||
      formData.maxPaymentPercentage !==
        Number(project.maxPaymentPercentage || 100);

    setIsDirty(hasChanges);
  }, [formData, project]);

  // Предупреждение при закрытии вкладки/окна
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название проекта обязательно',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.domain.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Домен сайта обязателен',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        setIsDirty(false); // Сбрасываем флаг изменений после успешного сохранения

        toast({
          title: 'Успех',
          description: 'Настройки проекта обновлены'
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast({
        title: 'Ошибка',
        description:
          error instanceof Error
            ? error.message
            : 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/dashboard/projects');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      throw error;
    }
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

  if (!project) {
    return <ProjectNotFoundState errorType={loadError ?? 'not_found'} />;
  }

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Heading
            title={`Настройки: ${project?.name || 'Проект'}`}
            description='Основные параметры и конфигурация проекта'
          />
        </div>
        <div className='flex items-center space-x-2'>
          {project?.isActive ? (
            <Badge variant='default' className='bg-green-600'>
              Активен
            </Badge>
          ) : (
            <Badge variant='destructive'>Неактивен</Badge>
          )}
        </div>
      </div>

      <Separator />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Main form */}
        <div className='space-y-6 lg:col-span-2'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center'>
                    <Settings className='mr-2 h-5 w-5' />
                    Основные настройки
                  </CardTitle>
                  <CardDescription>
                    Базовые параметры проекта бонусной системы
                  </CardDescription>
                </div>
                <div className='flex items-center space-x-2'>
                  <Switch
                    id='isActive-header'
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor='isActive-header' className='cursor-pointer'>
                    Проект активен
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Название проекта *</Label>
                    <Input
                      id='name'
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder='Мой интернет-магазин'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='domain'>Домен сайта *</Label>
                    <Input
                      id='domain'
                      value={formData.domain}
                      onChange={(e) =>
                        setFormData({ ...formData, domain: e.target.value })
                      }
                      placeholder='example.com'
                      required
                    />
                  </div>
                </div>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  {/* Приветственное вознаграждение */}
                  <div className='col-span-2 space-y-4 rounded-lg border p-4'>
                    <div>
                      <Label className='flex items-center space-x-2 text-base'>
                        <Gift className='h-4 w-4 text-emerald-600' />
                        <span>
                          Приветственное вознаграждение при регистрации
                        </span>
                      </Label>
                      <p className='mt-1 text-sm text-gray-600'>
                        Выберите тип вознаграждения для новых пользователей
                      </p>
                    </div>

                    {/* Переключатель типа */}
                    <div className='grid grid-cols-2 gap-3'>
                      <button
                        type='button'
                        onClick={() =>
                          setFormData({
                            ...formData,
                            welcomeRewardType: 'BONUS'
                          })
                        }
                        className={`rounded-lg border-2 p-3 text-left transition-colors ${
                          formData.welcomeRewardType === 'BONUS'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className='flex items-center space-x-2'>
                          <Gift className='h-5 w-5 text-emerald-600' />
                          <span className='font-medium'>Бонусы</span>
                        </div>
                        <p className='mt-1 text-xs text-gray-600'>
                          Начислить фиксированную сумму бонусов
                        </p>
                      </button>
                      <button
                        type='button'
                        onClick={() =>
                          setFormData({
                            ...formData,
                            welcomeRewardType: 'DISCOUNT'
                          })
                        }
                        className={`rounded-lg border-2 p-3 text-left transition-colors ${
                          formData.welcomeRewardType === 'DISCOUNT'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className='flex items-center space-x-2'>
                          <Percent className='h-5 w-5 text-purple-600' />
                          <span className='font-medium'>Скидка</span>
                        </div>
                        <p className='mt-1 text-xs text-gray-600'>
                          Процентная скидка на первую покупку
                        </p>
                      </button>
                    </div>

                    {/* Поле значения в зависимости от типа */}
                    {formData.welcomeRewardType === 'BONUS' ? (
                      <div className='space-y-2'>
                        <Label htmlFor='welcomeBonusAmount'>
                          Сумма приветственных бонусов
                        </Label>
                        <Input
                          id='welcomeBonusAmount'
                          type='number'
                          step='1'
                          min='0'
                          value={formData.welcomeBonusAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              welcomeBonusAmount:
                                parseFloat(e.target.value) || 0
                            })
                          }
                          placeholder='0'
                        />
                        <p className='text-xs text-gray-600'>
                          Фиксированное начисление при регистрации. Срок
                          действия — как указано выше.
                        </p>
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        <Label htmlFor='firstPurchaseDiscountPercent'>
                          Скидка на первую покупку (%)
                        </Label>
                        <Input
                          id='firstPurchaseDiscountPercent'
                          type='number'
                          step='1'
                          min='0'
                          max='100'
                          value={formData.firstPurchaseDiscountPercent}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              firstPurchaseDiscountPercent:
                                parseInt(e.target.value) || 0
                            })
                          }
                          placeholder='10'
                        />
                        <p className='text-xs text-gray-600'>
                          Процент скидки на первую покупку нового пользователя.
                          Действует однократно.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='bonusBehavior'>
                      Когда начислять бонусы?
                    </Label>
                    <Select
                      value={formData.bonusBehavior}
                      onValueChange={(
                        value: 'SPEND_AND_EARN' | 'SPEND_ONLY' | 'EARN_ONLY'
                      ) => setFormData({ ...formData, bonusBehavior: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Выберите логику начисления' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='SPEND_AND_EARN'>
                          При оплате бонусами — начислять на остаток
                        </SelectItem>
                        <SelectItem value='SPEND_ONLY'>
                          При оплате бонусами — не начислять новые
                        </SelectItem>
                        <SelectItem value='EARN_ONLY'>
                          Бонусы нельзя тратить, только копить
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='bonusExpiryDays'>
                      Срок действия бонусов (дней)
                    </Label>
                    <Input
                      id='bonusExpiryDays'
                      type='number'
                      min='1'
                      max='3650'
                      step='1'
                      value={formData.bonusExpiryDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bonusExpiryDays: parseInt(e.target.value) || 365
                        })
                      }
                      placeholder='365'
                    />
                    <p className='text-muted-foreground text-xs'>
                      Через сколько дней истекают начисленные бонусы (по
                      умолчанию 365 дней)
                    </p>
                  </div>
                </div>

                {/* Режим начисления бонусов */}
                <div className='col-span-2'>
                  <BonusModeSelector
                    value={formData.bonusMode}
                    onChange={(mode) =>
                      setFormData({ ...formData, bonusMode: mode })
                    }
                    hasLevels={hasLevels}
                    levelsCount={levelsCount}
                  />
                </div>

                {/* Настройки в зависимости от режима */}
                {formData.bonusMode === 'SIMPLE' && (
                  <>
                    <div className='col-span-2 space-y-2'>
                      <Label htmlFor='bonusPercentage'>
                        Процент начисления бонусов (%)
                      </Label>
                      <Input
                        id='bonusPercentage'
                        type='number'
                        min='0'
                        max='100'
                        step='0.01'
                        value={formData.bonusPercentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bonusPercentage: parseFloat(e.target.value) || 0
                          })
                        }
                        placeholder='5.0'
                      />
                      <p className='text-muted-foreground text-xs'>
                        Пример: При покупке на 1000₽ клиент получит{' '}
                        {Math.round(1000 * (formData.bonusPercentage / 100))}₽
                        бонусов
                      </p>
                    </div>

                    <div className='col-span-2 space-y-2'>
                      <Label htmlFor='maxPaymentPercentage'>
                        Макс. % списания бонусов (%)
                      </Label>
                      <Input
                        id='maxPaymentPercentage'
                        type='number'
                        min='0'
                        max='100'
                        step='1'
                        value={formData.maxPaymentPercentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxPaymentPercentage: parseInt(e.target.value) || 0
                          })
                        }
                        placeholder='100'
                      />
                      <p className='text-muted-foreground text-xs'>
                        Максимальный процент от суммы заказа, который можно
                        оплатить бонусами
                      </p>
                    </div>
                  </>
                )}

                {formData.bonusMode === 'LEVELS' && (
                  <div className='col-span-2 space-y-2'>
                    <Label className='text-muted-foreground'>
                      Процент начисления
                    </Label>
                    <div className='rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950'>
                      <p className='text-sm text-blue-700 dark:text-blue-300'>
                        Процент начисления определяется{' '}
                        <Link
                          href={`/dashboard/projects/${projectId}/bonus-levels`}
                          className='font-medium underline hover:no-underline'
                        >
                          уровнями бонусов
                        </Link>
                        . Перейдите в раздел для настройки уровней.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Operation Mode Selector */}
          <OperationModeSelector
            value={formData.operationMode}
            onChange={(mode) => {
              if (mode !== formData.operationMode) {
                setPendingMode(mode);
                setShowModeConfirmDialog(true);
              }
            }}
            hasExistingUsers={usersCount > 0}
            disabled={saving}
          />
          {formData.operationMode === 'WITHOUT_BOT' ? (
            <div className='rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'>
              Настройки мессенджеров скрыты, активные боты будут остановлены,
              новые пользователи активируются автоматически и могут тратить
              бонусы без привязки к боту.
            </div>
          ) : (
            <div className='rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100'>
              Пользователи создаются неактивными и должны активировать профиль
              через бота; без корректной настройки бота списания бонусов будут
              отклоняться. Подключите бота в разделе "Интеграции".
            </div>
          )}

          {/* B2B Иерархия партнёров (опт-ин per project) */}
          <B2bHierarchySettings
            projectId={projectId}
            initialValue={Boolean((project as any)?.enablePartnerRoles)}
            initialTeamManagement={Boolean(
              (project as any)?.enablePartnerTeamManagement ?? true
            )}
            initialJoinApproval={Boolean(
              (project as any)?.referralJoinRequiresApproval
            )}
            adminSub={adminSub}
          />

          {/* Предупреждение о несохраненных изменениях */}
          {isDirty && (
            <div className='rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950'>
              <p className='text-sm text-amber-800 dark:text-amber-200'>
                ⚠️ У вас есть несохраненные изменения. Не забудьте сохранить их
                перед выходом со страницы.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className='flex justify-end'>
            <div className='flex items-center gap-2'>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
              <Button
                type='button'
                variant='destructive'
                onClick={() => setShowDeleteDialog(true)}
              >
                Удалить проект
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-3'>
              {/* Убрана настройка Telegram бота из Quick Actions (перенесена в Интеграции) */}
              <Link href={`/dashboard/projects/${projectId}/users`}>
                <Button variant='outline' className='w-full justify-start'>
                  <Users className='mr-2 h-4 w-4' />
                  Управление пользователями
                </Button>
              </Link>
              {formData.bonusMode === 'LEVELS' && (
                <Link href={`/dashboard/projects/${projectId}/bonus-levels`}>
                  <Button variant='outline' className='w-full justify-start'>
                    <Coins className='mr-2 h-4 w-4' />
                    Уровни бонусов
                  </Button>
                </Link>
              )}
              {project?.operationMode === 'WITH_BOT' ? (
                <Link href={`/dashboard/projects/${projectId}/referral`}>
                  <Button variant='outline' className='w-full justify-start'>
                    <Share2 className='mr-2 h-4 w-4' />
                    Реферальная программа
                  </Button>
                </Link>
              ) : (
                <Button
                  variant='outline'
                  className='w-full cursor-not-allowed justify-start opacity-50'
                  disabled
                  title='Реферальная программа доступна только с Telegram ботом'
                >
                  <Share2 className='mr-2 h-4 w-4' />
                  Реферальная программа
                  <span className='text-muted-foreground ml-auto text-xs'>
                    Недоступно
                  </span>
                </Button>
              )}
              <Link href={`/dashboard/projects/${projectId}/analytics`}>
                <Button variant='outline' className='w-full justify-start'>
                  <BarChart3 className='mr-2 h-4 w-4' />
                  Статистика и аналитика
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/workflow`}>
                <Button variant='outline' className='w-full justify-start'>
                  <Workflow className='mr-2 h-4 w-4' />
                  Конструктор Workflow
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/integrations`}>
                <Button variant='outline' className='w-full justify-start'>
                  <Plug className='mr-2 h-4 w-4' />
                  Интеграции
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Новый функционал - СКРЫТ */}
          {/* 
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Продажи и аналитика</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Link href={`/dashboard/projects/${projectId}/orders`}>
                <Button variant='outline' className='w-full justify-start'>
                  <ShoppingCart className='mr-2 h-4 w-4' />
                  Заказы
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/products`}>
                <Button variant='outline' className='mt-2 w-full justify-start'>
                  <Package className='mr-2 h-4 w-4' />
                  Товары
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/retailcrm`}>
                <Button variant='outline' className='mt-2 w-full justify-start'>
                  <ShoppingBag className='mr-2 h-4 w-4' />
                  RetailCRM
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Маркетинг</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Link href={`/dashboard/projects/${projectId}/segments`}>
                <Button variant='outline' className='w-full justify-start'>
                  <Users2 className='mr-2 h-4 w-4' />
                  Сегменты
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/mailings`}>
                <Button variant='outline' className='mt-2 w-full justify-start'>
                  <Mail className='mr-2 h-4 w-4' />
                  Рассылки
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Коммуникации</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Link href={`/dashboard/projects/${projectId}/chats`}>
                <Button variant='outline' className='w-full justify-start'>
                  <MessageSquare className='mr-2 h-4 w-4' />
                  Чаты
                </Button>
              </Link>
            </CardContent>
          </Card>
          */}

          {/* Project Info */}
          {project && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Информация о проекте</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <Label className='text-sm font-medium'>ID проекта</Label>
                  <p className='text-muted-foreground font-mono text-sm'>
                    {project.id}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Webhook Secret</Label>
                  <p className='text-muted-foreground font-mono text-sm'>
                    {project.webhookSecret}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Создан</Label>
                  <p className='text-muted-foreground text-sm'>
                    {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Обновлен</Label>
                  <p className='text-muted-foreground text-sm'>
                    {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integration info — удалено по требованию */}
        </div>
      </div>

      {/* Диалог удаления проекта */}
      {project && (
        <ProjectDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          projectName={project.name}
          onConfirm={handleDeleteProject}
        />
      )}

      {/* Диалог подтверждения изменения режима работы */}
      {pendingMode && (
        <OperationModeConfirmDialog
          open={showModeConfirmDialog}
          onOpenChange={(open) => {
            setShowModeConfirmDialog(open);
            if (!open) setPendingMode(null);
          }}
          currentMode={formData.operationMode}
          newMode={pendingMode}
          existingUsersCount={usersCount}
          onConfirm={() => {
            setFormData({ ...formData, operationMode: pendingMode });
            setShowModeConfirmDialog(false);
            setPendingMode(null);
          }}
        />
      )}
    </div>
  );
}
