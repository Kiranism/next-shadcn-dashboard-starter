import PageContainer from '@/components/layout/page-container';
import { NormsView } from '@/features/norms/components/norms-view';

export const metadata = { title: 'Dashboard: Manual de Conduta' };

export default function ManualDeCondutaPage() {
  return (
    <PageContainer
      pageTitle='Manual de Conduta'
      pageDescription='Normas e estatuto interno da empresa.'
    >
      <NormsView />
    </PageContainer>
  );
}
