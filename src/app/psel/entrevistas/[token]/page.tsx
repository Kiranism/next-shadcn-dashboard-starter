import type { Metadata } from 'next';
import { InterviewScheduler } from '@/features/selection-process/components/interview/interview-scheduler';

export const metadata: Metadata = {
  title: 'Agendar Entrevista — Watt Consultoria',
  description: 'Escolha um horário para sua entrevista no Processo Seletivo da Watt Consultoria'
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PselEntrevistasPage({ params }: Props) {
  const { token } = await params;
  return (
    <div className='mx-auto max-w-lg px-4 py-8'>
      <InterviewScheduler token={token} />
    </div>
  );
}
