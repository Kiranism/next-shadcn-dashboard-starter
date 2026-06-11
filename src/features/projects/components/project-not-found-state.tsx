/**
 * @file: project-not-found-state.tsx
 * @description: Состояние ошибки при загрузке проекта
 * @project: SaaS Bonus System
 * @dependencies: EmptyState, shadcn/ui
 * @created: 2026-06-11
 * @author: AI Assistant + User
 */

'use client';

import Link from 'next/link';
import { ArrowLeft, FolderX, Lock, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/composite';

export type ProjectLoadError = 'not_found' | 'forbidden' | 'error';

interface ProjectNotFoundStateProps {
  errorType?: ProjectLoadError;
}

const errorConfig: Record<
  ProjectLoadError,
  { icon: typeof FolderX; title: string; description: string }
> = {
  not_found: {
    icon: FolderX,
    title: 'Проект не найден',
    description: 'Проект с таким идентификатором не существует или был удалён.'
  },
  forbidden: {
    icon: Lock,
    title: 'Нет доступа к проекту',
    description:
      'Этот проект не принадлежит вашему аккаунту. Проверьте ссылку или выберите другой проект.'
  },
  error: {
    icon: FolderX,
    title: 'Не удалось загрузить проект',
    description:
      'Произошла ошибка при загрузке данных. Попробуйте обновить страницу.'
  }
};

export function ProjectNotFoundState({
  errorType = 'not_found'
}: ProjectNotFoundStateProps) {
  const config = errorConfig[errorType];

  return (
    <div className='flex flex-1 flex-col items-center justify-center p-6'>
      <EmptyState
        size='lg'
        icon={config.icon}
        title={config.title}
        description={config.description}
        action={
          <div className='flex flex-col items-center gap-3'>
            {errorType === 'forbidden' && (
              <Alert className='max-w-md text-left'>
                <AlertDescription className='text-sm'>
                  Если проект был создан до обновления системы, привяжите его к
                  аккаунту командой:{' '}
                  <code className='bg-muted rounded px-1.5 py-0.5 text-xs'>
                    npm run migrate-owners migrate &lt;ваш_email&gt;
                  </code>
                </AlertDescription>
              </Alert>
            )}
            <div className='flex flex-wrap justify-center gap-2'>
              <Button variant='outline' asChild>
                <Link href='/dashboard/projects'>
                  <ArrowLeft className='mr-2 h-4 w-4' />К проектам
                </Link>
              </Button>
              {errorType === 'error' && (
                <Button
                  variant='outline'
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Обновить
                </Button>
              )}
              <Button asChild>
                <Link href='/dashboard/projects?create=true'>
                  <Plus className='mr-2 h-4 w-4' />
                  Создать проект
                </Link>
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
}
