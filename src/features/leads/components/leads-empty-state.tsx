import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

interface LeadsEmptyStateProps {
  filtered: boolean;
  onClearFilter?: () => void;
  onNewLead?: () => void;
}

export function LeadsEmptyState({ filtered, onClearFilter, onNewLead }: LeadsEmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center'>
      <div className='flex size-14 items-center justify-center rounded-full bg-muted'>
        <Icons.briefcase className='size-6 text-muted-foreground' />
      </div>
      {filtered ? (
        <>
          <div>
            <p className='font-medium'>Nenhum lead encontrado</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Tente ajustar os filtros de busca.
            </p>
          </div>
          {onClearFilter && (
            <Button variant='outline' size='sm' onClick={onClearFilter}>
              Limpar filtros
            </Button>
          )}
        </>
      ) : (
        <>
          <div>
            <p className='font-medium'>Nenhum lead cadastrado</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Clique em "Novo Lead" para começar a prospectar.
            </p>
          </div>
          {onNewLead && (
            <Button variant='outline' size='sm' onClick={onNewLead}>
              <Icons.add className='mr-1.5 size-4' />
              Novo Lead
            </Button>
          )}
        </>
      )}
    </div>
  );
}
