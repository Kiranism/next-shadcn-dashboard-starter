/**
 * @file: page.tsx
 * @description: Страница управления B2B-организациями проекта
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { PartnerOrganizationsPanel } from '@/features/projects/components/partner-organizations-panel';

export const metadata: Metadata = {
  title: 'Организации | Gupil',
  description: 'B2B-сети и филиалы внутри реферальной программы'
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className='flex flex-1 flex-col space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <Heading
          title='Организации'
          description='Отдельные партнёрские сети с собственными директорами, планами комиссий и статистикой'
        />
        <Button variant='outline' size='sm' asChild>
          <Link href={`/dashboard/projects/${id}/referral`}>
            <ArrowLeft className='mr-2 h-4 w-4' />К реферальной программе
          </Link>
        </Button>
      </div>
      <Separator />
      <PartnerOrganizationsPanel projectId={id} />
    </div>
  );
}
