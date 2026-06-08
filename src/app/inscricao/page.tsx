import { ApplicationForm } from '@/features/selection-process/components/inscription/application-form';

export default function InscricaoPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Processo Seletivo</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Preencha o formulário abaixo para se candidatar. Todos os campos marcados com * são
          obrigatórios.
        </p>
      </div>
      <ApplicationForm />
    </div>
  );
}
