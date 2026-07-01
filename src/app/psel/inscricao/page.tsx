import type { Metadata } from 'next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApplicationForm } from '@/features/selection-process/components/inscription/application-form';

export const metadata: Metadata = {
  title: 'Inscrição — Watt Consultoria',
  description: 'Candidate-se ao processo seletivo da Watt Consultoria'
};

export default function PselInscricaoPage() {
  return (
    <div className='mx-auto max-w-2xl px-4 py-8 space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Processo Seletivo</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Preencha o formulário abaixo para se candidatar. Todos os campos marcados com * são
          obrigatórios.
        </p>
      </div>
      <Alert>
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription className='text-sm space-y-3 mt-1'>
          <p>Leia atentamente as seguintes informações</p>
          <p>
            O nosso Processo Seletivo será realizado através dessa plataforma experimental que ainda
            está em fase de desenvolvimento e por isso pode apresentar instabilidades, caso encontre
            algum problema, envie um email para o seguinte endereço:{' '}
            <a href='mailto:psel@wattconsultoria.com.br' className='underline font-medium'>
              psel@wattconsultoria.com.br
            </a>
          </p>
          <p>
            Todas as regras e orientações do nosso Processo Seletivo estão documentadas e podem ser
            consultadas no seguinte edital:{' '}
            <a
              href='https://drive.google.com/file/d/1r4LZt_fyMn7g33hrb_EuaOJb7peCjYg_/view?usp=drive_link'
              target='_blank'
              rel='noopener noreferrer'
              className='underline font-medium'
            >
              Edital PSEL 2026.1
            </a>
          </p>
        </AlertDescription>
      </Alert>
      <ApplicationForm />
    </div>
  );
}
