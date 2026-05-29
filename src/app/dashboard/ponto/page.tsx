import PageContainer from '@/components/layout/page-container';
import { PontoEletronicoView } from '@/features/ponto-eletronico/components/ponto-eletronico-view';

export const metadata = { title: 'Dashboard: Ponto Eletrônico' };

export default function PontoPage() {
  return (
    <PageContainer
      pageTitle='Ponto Eletrônico'
      pageDescription='Registre sua entrada e saída e acompanhe suas horas semanais.'
    >
      <PontoEletronicoView />
    </PageContainer>
  );
}
