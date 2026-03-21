'use client';

import { Button } from '@/components/ui/button';
import { Kanban, List } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

interface TripsViewToggleProps {
  currentView: string;
}

export function TripsViewToggle({ currentView }: TripsViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div
      className='bg-muted/50 flex w-full items-center gap-1 rounded-lg p-1 md:w-fit md:gap-2'
      role='group'
      aria-label='Ansicht wechseln'
    >
      <Button
        variant={currentView === 'list' ? 'secondary' : 'ghost'}
        size='sm'
        onClick={() => {
          startTransition(() => {
            router.push(pathname + '?' + createQueryString('view', 'list'));
            router.refresh();
          });
        }}
        className='h-10 min-h-10 flex-1 shadow-none md:h-8 md:min-h-0 md:flex-initial'
      >
        <List className='mr-2 h-4 w-4 shrink-0' />
        Liste
      </Button>
      <Button
        variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
        size='sm'
        onClick={() => {
          startTransition(() => {
            router.push(pathname + '?' + createQueryString('view', 'kanban'));
            router.refresh();
          });
        }}
        className='h-10 min-h-10 flex-1 shadow-none md:h-8 md:min-h-0 md:flex-initial'
      >
        <Kanban className='mr-2 h-4 w-4 shrink-0' />
        Kanban
      </Button>
    </div>
  );
}
