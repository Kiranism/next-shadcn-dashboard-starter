import PageContainer from '@/components/layout/page-container';
import { FaltasView } from '@/features/violations/components/faltas-view';

export const metadata = { title: 'Dashboard: Faltas' };

export default function FaltasPage() {
  return (
    <PageContainer pageTitle='Faltas' pageDescription='Registro de infrações ao estatuto interno.'>
      <FaltasView />
    </PageContainer>
  );
}
