import type { Metadata } from 'next';
import { Icons } from '@/components/icons';

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default function PselPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-background min-h-svh'>
      <header className='border-b'>
        <div className='mx-auto flex max-w-4xl items-center gap-2 px-4 py-4'>
          <div className='bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md'>
            <Icons.logo className='size-4' />
          </div>
          <span className='font-semibold'>Watt Consultoria</span>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
