import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { ActivitiesSection } from '@/features/activities/components/activities-section';

export const metadata = { title: 'Dashboard: Individual' };

export default function IndividualPage() {
  return (
    <PageContainer
      pageTitle='Individual'
      pageDescription='Gerencie suas atividades e compromissos pessoais.'
    >
      <Suspense>
        <ActivitiesSection />
      </Suspense>
    </PageContainer>
  );
}
