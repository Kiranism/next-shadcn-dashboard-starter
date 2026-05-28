/**
 * @file: error.tsx
 * @description: Error boundary для страницы иерархии партнёров.
 *               Перехватывает любые runtime exceptions (как server так и
 *               client-side) и показывает осмысленное сообщение вместо
 *               белого экрана «Application error».
 * @project: SaaS Bonus System
 * @dependencies: shadcn/ui
 * @created: 2026-05-28
 * @author: AI Assistant + User
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface HierarchyErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function HierarchyError({
  error,
  reset
}: HierarchyErrorProps) {
  useEffect(() => {
    // Логируем в console для DevTools — Server Component error.tsx
    // получает сообщение редактированным в production. Хоть что-то.
    console.error('[hierarchy-page] runtime error', error);
  }, [error]);

  return (
    <div className='flex flex-1 flex-col items-center justify-center px-6 py-16'>
      <div className='flex max-w-xl flex-col items-center text-center'>
        <div className='bg-destructive/10 text-destructive mb-4 rounded-full p-3'>
          <AlertTriangle className='h-12 w-12' />
        </div>
        <h2 className='text-foreground text-2xl font-semibold'>
          Не удалось загрузить иерархию
        </h2>
        <p className='text-muted-foreground mt-2 text-sm'>
          Произошла ошибка при отображении дерева партнёров. Попробуйте
          обновить страницу. Если проблема повторяется — отключите b2b-режим в
          настройках проекта и сообщите в поддержку.
        </p>
        {error?.message && (
          <pre className='bg-muted text-muted-foreground mt-4 max-w-full overflow-x-auto rounded-md p-3 text-left text-xs'>
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ''}
          </pre>
        )}
        <div className='mt-6 flex flex-wrap gap-2'>
          <Button onClick={reset} className='gap-2'>
            <RefreshCcw className='h-4 w-4' />
            Попробовать снова
          </Button>
          <Link href='./'>
            <Button variant='outline'>К проекту</Button>
          </Link>
          <Link href='./settings'>
            <Button variant='ghost' className='gap-2'>
              <Settings className='h-4 w-4' />
              Настройки
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
