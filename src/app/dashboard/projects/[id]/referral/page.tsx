/**
 * @file: src/app/dashboard/projects/[id]/referral/page.tsx
 * @description: Страница реферальной программы проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { Metadata } from 'next';
import { ReferralProgramView } from '@/features/projects/components/referral-program-view';

export const metadata: Metadata = {
  title: 'Реферальная программа - SaaS Bonus System',
  description: 'Настройка реферальной программы проекта'
};

interface ReferralPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { id } = await params;

  return (
    <div className='p-6'>
      <ReferralProgramView projectId={id} />
    </div>
  );
}
