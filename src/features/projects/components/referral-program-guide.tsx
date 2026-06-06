/**
 * @file: referral-program-guide.tsx
 * @description: Пояснение разницы между «Настройки» и «Планы %» реферальной программы
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

'use client';

import { ArrowRight, Gift, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface ReferralProgramGuideProps {
  enablePartnerRoles?: boolean;
}

export function ReferralProgramGuide({
  enablePartnerRoles = false
}: ReferralProgramGuideProps) {
  if (enablePartnerRoles) {
    return (
      <Alert className='border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/30'>
        <Users className='h-4 w-4 text-blue-600' />
        <AlertTitle className='text-blue-900 dark:text-blue-100'>
          Две разные части реферальной системы
        </AlertTitle>
        <AlertDescription className='space-y-4 text-sm text-blue-950/90 dark:text-blue-100/90'>
          <div className='grid gap-3 md:grid-cols-2'>
            <div className='rounded-md border border-blue-200/80 bg-white/70 p-3 dark:border-blue-800/50 dark:bg-blue-950/20'>
              <div className='mb-2 flex items-center gap-2'>
                <Badge variant='secondary'>Вкладка «Настройки»</Badge>
                <Gift className='h-4 w-4' />
              </div>
              <p className='font-medium'>Что получает клиент (покупатель)</p>
              <ul className='text-muted-foreground mt-2 list-inside list-disc space-y-1'>
                <li>Приветственные бонусы или скидка при регистрации</li>
                <li>% бонусов с первой покупки</li>
                <li>Минимальная сумма заказа, срок отслеживания ссылки</li>
              </ul>
            </div>
            <div className='rounded-md border border-blue-200/80 bg-white/70 p-3 dark:border-blue-800/50 dark:bg-blue-950/20'>
              <div className='mb-2 flex items-center gap-2'>
                <Badge variant='secondary'>Вкладка «Комиссии»</Badge>
                <ArrowRight className='h-4 w-4' />
              </div>
              <p className='font-medium'>Что получают партнёры (комиссия)</p>
              <ul className='text-muted-foreground mt-2 list-inside list-disc space-y-1'>
                <li>L1 — тренер с покупки своего клиента</li>
                <li>L2 — менеджер с покупки клиента тренера</li>
                <li>L3 — директор с покупки в своей сети</li>
              </ul>
            </div>
          </div>
          <p>
            <strong>Планы назначаются партнёрам</strong> (тренер / менеджер /
            директор) внизу вкладки «Комиссии» или в профиле пользователя. Роль
            партнёра задаётся в «Пользователи», а не автоматически при
            регистрации по ссылке.
          </p>
          <p className='text-muted-foreground'>
            Когда включены персональные планы, блок «Многоуровневая программа»
            во вкладке «Настройки» используется только как шаблон для кнопки
            «Создать план из текущей программы» — реальные выплаты идут по
            планам.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <Gift className='h-4 w-4' />
      <AlertTitle>Настройки и планы — зачем две вкладки</AlertTitle>
      <AlertDescription className='space-y-2 text-sm'>
        <p>
          <strong>«Настройки»</strong> — бонусы для новых клиентов и базовые
          уровни реферальной программы (c2c-режим).
        </p>
        <p>
          <strong>«Планы %»</strong> — персональные схемы комиссий для отдельных
          партнёров. Включите переключатель «Персональные планы», если разным
          партнёрам нужны разные проценты.
        </p>
      </AlertDescription>
    </Alert>
  );
}
