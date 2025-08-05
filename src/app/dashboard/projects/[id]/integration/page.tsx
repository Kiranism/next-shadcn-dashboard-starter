/**
 * @file: page.tsx
 * @description: Страница интеграции с Tilda
 * @project: SaaS Bonus System
 * @dependencies: TildaIntegrationView
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { TildaIntegrationView } from '@/features/projects/components/tilda-integration-view';
import PageContainer from '@/components/layout/page-container';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProject(id: string) {
  try {
    const project = await db.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!project) return null;

    // Преобразуем Decimal в number для клиентского компонента
    return {
      ...project,
      bonusPercentage: Number(project.bonusPercentage)
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export default async function TildaIntegrationPage({ params }: PageProps) {
  const resolvedParams = await params;
  const project = await getProject(resolvedParams.id);

  if (!project) {
    notFound();
  }

  return (
    <PageContainer scrollable={true}>
      <TildaIntegrationView project={project} />
    </PageContainer>
  );
}
