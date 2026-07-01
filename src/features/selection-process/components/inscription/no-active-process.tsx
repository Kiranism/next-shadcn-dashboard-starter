import { Icons } from '@/components/icons';

export function NoActiveProcess() {
  return (
    <div className='flex flex-col items-center justify-center gap-6 py-12 text-center'>
      <div className='flex size-20 items-center justify-center rounded-full bg-muted'>
        <Icons.calendar className='size-10 text-muted-foreground' />
      </div>
      <div className='space-y-2'>
        <h2 className='text-2xl font-bold'>Nenhum processo ativo</h2>
        <p className='text-muted-foreground max-w-sm text-base'>
          Não há processo seletivo ativo no momento. Fique atento às nossas redes sociais!
        </p>
      </div>
    </div>
  );
}
