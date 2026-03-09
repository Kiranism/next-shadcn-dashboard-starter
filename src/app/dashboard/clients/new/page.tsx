import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import ClientForm from '@/features/clients/components/client-form';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Neuer Fahrgast'
};

export default function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <ClientForm initialData={null} pageTitle='Neuen Fahrgast erstellen' />
        </Suspense>
      </div>
    </PageContainer>
  );
}
