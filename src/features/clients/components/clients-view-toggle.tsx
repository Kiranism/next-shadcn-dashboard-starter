'use client';

/**
 * ClientsViewToggle
 *
 * A compact icon button group rendered in the Fahrgäste page header.
 * Switches between the classic data table view and the Miller Columns view
 * by writing `?view=table` or `?view=columns` to the URL.
 *
 * Both views are independently functional — switching is non-destructive and
 * the browser back button always works correctly.
 *
 * The active view button is highlighted with bg-muted so the current state
 * is immediately obvious without relying on color alone (accessibility).
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

export function ClientsViewToggle() {
  // 'columns' is the default — no ?view param in the URL = Spaltenansicht.
  // shallow: false is required so that changing the view triggers a server
  // component re-render in page.tsx (which reads ?view server-side to decide
  // which layout to render). Without this, nuqs updates the URL client-side only
  // and page.tsx never sees the new value — nothing appears to change visually.
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
