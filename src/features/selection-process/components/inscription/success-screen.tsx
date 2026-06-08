import { Icons } from '@/components/icons';

export function SuccessScreen() {
  return (
    <div className='flex flex-col items-center justify-center gap-6 py-12 text-center'>
      <div className='flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40'>
        <Icons.circleCheck className='size-10 text-emerald-600 dark:text-emerald-400' />
      </div>
      <div className='space-y-2'>
        <h2 className='text-2xl font-bold'>Candidatura enviada!</h2>
        <p className='text-muted-foreground max-w-sm text-base'>
          Recebemos sua inscrição. Em breve entraremos em contato pelo e-mail ou Instagram
          informados.
        </p>
      </div>
      <p className='text-muted-foreground text-sm'>
        Fique atento às nossas redes sociais para novidades sobre o processo seletivo.
      </p>
    </div>
  );
}
