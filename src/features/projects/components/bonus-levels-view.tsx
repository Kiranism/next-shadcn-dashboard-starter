/**
 * @file: src/features/projects/components/bonus-levels-view.tsx
 * @description: Компонент управления уровнями бонусной программы с drag&drop
 * @project: SaaS Bonus System
 * @dependencies: React, DnD Kit, Shadcn/ui
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Edit,
  Trash2,
  RotateCcw,
  AlertCircle,
  Target,
  Percent,
  CreditCard
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement
} from '@dnd-kit/modifiers';
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
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BonusLevelCard } from './bonus-level-card';
import { BonusLevelDialog } from './bonus-level-dialog';
import type { Project, BonusLevel } from '@/types/bonus';

interface BonusLevelsViewProps {
  projectId: string;
}

export function BonusLevelsView({ projectId }: BonusLevelsViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [bonusLevels, setBonusLevels] = useState<BonusLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<BonusLevel | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const loadData = async () => {
    try {
      setLoading(true);

      // Load project
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
      }

      // Load bonus levels
      const levelsResponse = await fetch(
        `/api/projects/${projectId}/bonus-levels`
      );
      if (levelsResponse.ok) {
        const levelsData = await levelsResponse.json();
        // Исправляем: API возвращает {success: true, data: [...]}
        const levels = levelsData.data || levelsData;
        setBonusLevels(Array.isArray(levels) ? levels : []);
      } else {
        // Если API не работает, устанавливаем пустой массив
        setBonusLevels([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setBonusLevels([]); // Устанавливаем пустой массив в случае ошибки
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = bonusLevels.findIndex((level) => level.id === active.id);
      const newIndex = bonusLevels.findIndex((level) => level.id === over.id);

      const reorderedLevels = arrayMove(bonusLevels, oldIndex, newIndex);
      setBonusLevels(reorderedLevels);

      // Prepare reorder data
      const reorderData = reorderedLevels.map((level, index) => ({
        id: level.id,
        order: index + 1
      }));

      try {
        setReordering(true);

        const response = await fetch(
          `/api/projects/${projectId}/bonus-levels/reorder`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ levels: reorderData })
          }
        );

        if (!response.ok) {
          // Revert on error
          setBonusLevels(bonusLevels);
          throw new Error('Ошибка изменения порядка');
        }

        toast({
          title: 'Успех',
          description: 'Порядок уровней обновлен'
        });
      } catch (error) {
        console.error('Ошибка изменения порядка:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось изменить порядок уровней',
          variant: 'destructive'
        });
      } finally {
        setReordering(false);
      }
    }
  };

  const handleCreateLevel = () => {
    setEditingLevel(null);
    setDialogOpen(true);
  };

  const handleEditLevel = (level: BonusLevel) => {
    setEditingLevel(level);
    setDialogOpen(true);
  };

  const handleDeleteLevel = async (levelId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот уровень?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/bonus-levels/${levelId}`,
        {
          method: 'DELETE'
        }
      );

      if (response.ok) {
        setBonusLevels(bonusLevels.filter((level) => level.id !== levelId));
        toast({
          title: 'Успех',
          description: 'Уровень удален'
        });
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить уровень',
        variant: 'destructive'
      });
    }
  };

  const handleResetDefaults = async () => {
    if (
      !confirm(
        'Это действие деактивирует все текущие уровни и создаст базовые уровни по умолчанию. Продолжить?'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/bonus-levels/reset-defaults`,
        {
          method: 'POST'
        }
      );

      if (response.ok) {
        await loadData();
        toast({
          title: 'Успех',
          description: 'Уровни сброшены к значениям по умолчанию'
        });
      } else {
        throw new Error('Ошибка сброса');
      }
    } catch (error) {
      console.error('Ошибка сброса:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сбросить уровни',
        variant: 'destructive'
      });
    }
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    loadData();
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

  const activeLevels = Array.isArray(bonusLevels)
    ? bonusLevels.filter((level) => level.isActive)
    : [];

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
              title={`Уровни бонусов: ${project?.name || 'Проект'}`}
              description='Настройка многоуровневой системы начисления бонусов'
            />
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <Button variant='outline' size='sm' onClick={handleResetDefaults}>
            <RotateCcw className='mr-2 h-4 w-4' />
            Сбросить к умолчанию
          </Button>
          <Button onClick={handleCreateLevel}>
            <Plus className='mr-2 h-4 w-4' />
            Добавить уровень
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Активных уровней
            </CardTitle>
            <Target className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activeLevels.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Максимальный бонус
            </CardTitle>
            <Percent className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {activeLevels.length > 0
                ? Math.max(...activeLevels.map((l) => l.bonusPercent))
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Максимальная оплата
            </CardTitle>
            <CreditCard className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {activeLevels.length > 0
                ? Math.max(...activeLevels.map((l) => l.paymentPercent))
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Пользователи автоматически получают уровень исходя из суммы всех
          покупок. Перетаскивайте уровни для изменения порядка.
        </AlertDescription>
      </Alert>

      {/* Main content */}
      {activeLevels.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Активные уровни</CardTitle>
            <CardDescription>
              Текущая настройка многоуровневой системы бонусов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={activeLevels.map((level) => level.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className='space-y-3'>
                  {activeLevels.map((level, index) => (
                    <BonusLevelCard
                      key={level.id}
                      level={level}
                      index={index}
                      isLast={index === activeLevels.length - 1}
                      onEdit={() => handleEditLevel(level)}
                      onDelete={() => handleDeleteLevel(level.id)}
                      disabled={reordering}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-16'>
            <Target className='mb-4 h-16 w-16 text-gray-400' />
            <h3 className='mb-2 text-lg font-semibold'>Уровни не настроены</h3>
            <p className='mb-6 max-w-md text-center text-gray-600'>
              Создайте уровни бонусной программы или используйте настройки по
              умолчанию
            </p>
            <div className='flex space-x-3'>
              <Button onClick={handleCreateLevel}>
                <Plus className='mr-2 h-4 w-4' />
                Создать уровень
              </Button>
              <Button variant='outline' onClick={handleResetDefaults}>
                <RotateCcw className='mr-2 h-4 w-4' />
                Базовые уровни
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <BonusLevelDialog
        projectId={projectId}
        level={editingLevel}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
