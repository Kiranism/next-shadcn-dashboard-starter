/**
 * @file: logs/page.tsx
 * @description: Страница логов интеграции (webhook логи)
 * @project: SaaS Bonus System
 */

import { Metadata } from 'next';
import { NextRequest } from 'next/server';

export const metadata: Metadata = {
  title: 'Логи интеграции | SaaS Bonus System',
  description: 'Просмотр логов интеграции (webhook) по проекту'
};

export default async function ProjectLogsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  // Простая серверная страница-обертка с клиентским рендером таблицы
  return (
    <div className='p-6'>
      <h2 className='text-2xl font-bold tracking-tight'>Логи интеграции</h2>
      <p className='text-muted-foreground mb-4'>Последние вызовы webhook API</p>
      {/* Минимальный клиентский вид: переиспользуем API интеграции */}
      {/* Можно расширить на полноценную таблицу с пагинацией */}
      <pre className='rounded bg-muted p-4 text-xs text-muted-foreground'>
        Для просмотра используйте API: /api/projects/{id}/integration/logs
      </pre>
    </div>
  );
}

