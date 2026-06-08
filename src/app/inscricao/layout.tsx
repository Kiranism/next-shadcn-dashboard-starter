import type { Metadata } from 'next';
import { Icons } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Inscrição — Watt Consultoria',
  description: 'Candidate-se ao processo seletivo da Watt Consultoria',
  robots: { index: false, follow: false }
};

export default function InscricaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-background min-h-svh'>
      <header className='border-b'>
        <div className='mx-auto flex max-w-2xl items-center gap-2 px-4 py-4'>
          <div className='bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md'>
            <Icons.logo className='size-4' />
          </div>
          <span className='font-semibold'>Watt Consultoria</span>
        </div>
      </header>
      <main className='mx-auto max-w-2xl px-4 py-8'>{children}</main>
    </div>
  );
}
