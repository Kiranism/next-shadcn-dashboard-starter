/**
 * @file: page.tsx
 * @description: Детальная страница B2B-организации
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import type { Metadata } from 'next';
import { OrganizationDetailView } from '@/features/projects/components/organization-detail-view';

export const metadata: Metadata = {
  title: 'Организация | Gupil',
  description: 'Управление B2B-сетью и участниками'
};

interface PageProps {
  params: Promise<{ id: string; organizationId: string }>;
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id, organizationId } = await params;

  return (
    <div className='p-6'>
      <OrganizationDetailView projectId={id} organizationId={organizationId} />
    </div>
  );
}
