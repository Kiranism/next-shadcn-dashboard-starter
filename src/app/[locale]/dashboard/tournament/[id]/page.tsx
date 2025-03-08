import { Metadata } from 'next';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import TournamentClientPage from './TournamentClientPage';
import { getLocale } from 'next-intl/server';
import { defaultLocale } from '@/config/locales';

export const metadata: Metadata = {
  title: 'Tournament Details',
  description: 'View and manage tournament details'
};

type PageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function Page(props: PageProps) {
  // Properly await params before using it
  const params = await props.params;

  // Extract the ID and locale after awaiting params
  const { id, locale = defaultLocale } = params;

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<div>Loading tournament details...</div>}>
          <TournamentClientPage tournamentId={id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
