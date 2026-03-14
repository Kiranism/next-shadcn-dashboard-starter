'use client';

import { Button } from '@/components/ui/button';
import { CalendarDays, Kanban, List } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface TripsViewToggleProps {
  currentView: string;
}

export function TripsViewToggle({ currentView }: TripsViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className='bg-muted/50 flex w-fit items-center gap-2 rounded-lg p-1'>
      <Button
        variant={currentView === 'list' ? 'secondary' : 'ghost'}
        size='sm'
        onClick={() =>
          router.push(pathname + '?' + createQueryString('view', 'list'))
        }
        className='h-8 shadow-none'
      >
        <List className='mr-2 h-4 w-4' />
        Liste
      </Button>
      <Button
        variant={currentView === 'calendar' ? 'secondary' : 'ghost'}
        size='sm'
        onClick={() =>
          router.push(pathname + '?' + createQueryString('view', 'calendar'))
        }
        className='h-8 shadow-none'
      >
        <CalendarDays className='mr-2 h-4 w-4' />
        Kalender
      </Button>
      <Button
        variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
        size='sm'
        onClick={() =>
          router.push(pathname + '?' + createQueryString('view', 'kanban'))
        }
        className='h-8 shadow-none'
      >
        <Kanban className='mr-2 h-4 w-4' />
        Kanban
      </Button>
    </div>
  );
}
