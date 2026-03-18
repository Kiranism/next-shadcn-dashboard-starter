'use client';

/**
 * DriversViewToggle — Switches between Miller Columns and table view.
 *
 * Columns view (Spaltenansicht) is the default; table view (Tabellenansicht) secondary.
 * Uses nuqs with shallow: false so the server component page re-renders on view change.
 */

import { parseAsString, useQueryState } from 'nuqs';
import { LayoutList, Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function DriversViewToggle() {
  const [view, setView] = useQueryState(
    'view',
    parseAsString.withDefault('columns').withOptions({ shallow: false })
  );

  const isColumns = view === 'columns';

  return (
    <div className='flex items-center rounded-md border p-0.5'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className={cn('h-7 w-7 p-0', !isColumns && 'bg-muted')}
            onClick={() => setView('table')}
            aria-label='Tabellenansicht'
            aria-pressed={!isColumns}
          >
            <LayoutList className='h-3.5 w-3.5' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>Tabellenansicht</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className={cn('h-7 w-7 p-0', isColumns && 'bg-muted')}
            onClick={() => setView('columns')}
            aria-label='Spaltenansicht'
            aria-pressed={isColumns}
          >
            <Columns3 className='h-3.5 w-3.5' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>Spaltenansicht</TooltipContent>
      </Tooltip>
    </div>
  );
}
