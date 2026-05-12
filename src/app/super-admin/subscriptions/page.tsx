/**
 * @file: src/app/super-admin/subscriptions/page.tsx
 * @description: Страница управления подписками
 * @project: SaaS Bonus System
 * @created: 2025-01-30
 * @author: AI Assistant
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { SubscriptionsTable } from '@/components/super-admin/subscriptions-table';
import { SubscriptionPlansTable } from '@/components/super-admin/subscription-plans-table';

export default function SuperAdminSubscriptionsPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>
          Управление подписками
        </h1>
        <p className='text-muted-foreground'>
          Управление тарифными планами и подписками пользователей
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Тарифные планы</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionPlansTable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список подписок</CardTitle>
          <CardDescription className='text-pretty'>
            Бесплатная подписка создаётся автоматически после подтверждения
            email (эндпоинт верификации): если у аккаунта ещё нет активной
            подписки, подбирается план со slug{' '}
            <code className='bg-muted rounded px-1 py-0.5 text-xs'>free</code>{' '}
            или{' '}
            <code className='bg-muted rounded px-1 py-0.5 text-xs'>
              starter
            </code>{' '}
            либо с ценой 0. Платные тарифы подключаются после оплаты (webhook
            ЮKassa и т.п.).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionsTable />
        </CardContent>
      </Card>
    </div>
  );
}
