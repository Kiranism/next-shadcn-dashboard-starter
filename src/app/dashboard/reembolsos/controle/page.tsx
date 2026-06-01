import PageContainer from '@/components/layout/page-container';
import { ControleView } from '@/features/reembolsos/components/controle/controle-view';

export const metadata = { title: 'Dashboard: Controle de Reembolsos' };

export default function ControlePage() {
  return (
    <PageContainer
      pageTitle='Controle de Reembolsos'
      pageDescription='Visão geral, análise e gestão de todas as solicitações de reembolso.'
    >
      <ControleView />
    </PageContainer>
  );
}
