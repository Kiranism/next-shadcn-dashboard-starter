import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

export default function ClientesPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs />

        <div className="flex items-start justify-between">
          <Heading
            title="Clientes"
            description="Gerencie os clientes do sistema"
          />
        </div>
        <Separator />

        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-medium">Lista de Clientes</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Página em construção - API integrada
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Endpoints disponíveis:
              <br />
              GET /api/clientes - Lista de clientes
              <br />
              POST /api/clientes - Criar cliente
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
