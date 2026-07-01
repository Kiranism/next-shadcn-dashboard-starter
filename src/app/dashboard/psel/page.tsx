import PageContainer from '@/components/layout/page-container';
import { PselView } from '@/features/selection-process/components/psel-view';

export const metadata = { title: 'Dashboard: Processo Seletivo' };

export default function PselPage() {
  return (
    <PageContainer
      pageTitle='Processo Seletivo'
      pageDescription='Gerencie processos seletivos e acompanhe as candidaturas.'
    >
      <PselView />
    </PageContainer>
  );
}
