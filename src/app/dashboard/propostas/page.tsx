import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { PropostaStatus } from '@/constants/data';

export default function PropostasPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs />

        <div className="flex items-start justify-between">
          <Heading
            title="Propostas"
            description="Gerencie as propostas de empréstimo consignado"
          />
        </div>
        <Separator />

        <div className="space-y-4">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">Lista de Propostas</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Página em construção - API integrada
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Endpoints disponíveis:
              <br />
              GET /api/propostas - Lista de propostas
              <br />
              POST /api/propostas - Criar proposta
            </p>
          </div>

          <div className="mt-8">
            <h4 className="text-sm font-medium mb-4">Status de Propostas Disponíveis:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(PropostaStatus).map(([key, value]) => (
                <div
                  key={key}
                  className={`px-3 py-2 rounded-md text-xs font-medium bg-${value.color} bg-opacity-10 text-${value.color}`}
                >
                  {value.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
