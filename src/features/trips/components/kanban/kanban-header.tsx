'use client';

/**
 * KanbanHeader – the sticky top bar of the Kanban board.
 *
 * Contains:
 * - Expand / collapse toggle
 * - Zoom controls (in / out + numeric input)
 * - Board title + trip count
 * - GroupBy selector (Fahrer / Status / Kostenträger)
 * - Verwerfen / Speichern action buttons
 */

import { Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { GroupByMode } from '@/features/trips/lib/kanban-types';

export interface KanbanHeaderProps {
  tripCount: number;
  groupBy: GroupByMode;
  onGroupByChange: (value: GroupByMode) => void;
  zoom: number;
  zoomDisplayValue: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomInputChange: (value: string) => void;
  onZoomInputFocus: () => void;
  onZoomInputBlur: (value: string) => void;
  onZoomInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  hasPendingChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function KanbanHeader({
  tripCount,
  groupBy,
  onGroupByChange,
  zoom,
  zoomDisplayValue,
  onZoomIn,
  onZoomOut,
  onZoomInputChange,
  onZoomInputFocus,
  onZoomInputBlur,
  onZoomInputKeyDown,
  isExpanded,
  onToggleExpand,
  hasPendingChanges,
  isSaving,
  onSave,
  onReset
}: KanbanHeaderProps) {
  const groupByLabel =
    groupBy === 'driver'
      ? 'Fahrer'
      : groupBy === 'status'
        ? 'Status'
        : 'Kostenträger';

  return (
    <div className='flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2 text-sm'>
      {/* Left side: expand + zoom + title */}
      <div className='flex items-center gap-2'>
        {/* Expand / collapse */}
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='text-muted-foreground hover:text-foreground h-8 w-8 shrink-0'
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Kanban verkleinern' : 'Kanban vergrößern'}
        >
          {isExpanded ? (
            <Minimize2 className='h-4 w-4' />
          ) : (
            <Maximize2 className='h-4 w-4' />
          )}
        </Button>

        {/* Zoom controls */}
        <div className='text-muted-foreground flex items-center gap-0.5 border-r pr-2'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={onZoomOut}
            disabled={zoom <= 0.5}
            aria-label='Verkleinern'
          >
            <ZoomOut className='h-4 w-4' />
          </Button>
          <Input
            type='text'
            inputMode='numeric'
            value={zoomDisplayValue}
            onChange={(e) => onZoomInputChange(e.target.value)}
            onFocus={onZoomInputFocus}
            onBlur={(e) => onZoomInputBlur(e.target.value)}
            onKeyDown={onZoomInputKeyDown}
            className='h-8 w-14 [appearance:textfield] px-2 text-center text-xs [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
            aria-label='Zoom in Prozent'
          />
          <span className='text-muted-foreground text-xs'>%</span>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={onZoomIn}
            disabled={zoom >= 1}
            aria-label='Vergrößern'
          >
            <ZoomIn className='h-4 w-4' />
          </Button>
        </div>

        {/* Board title */}
        <div className='flex flex-col'>
          <span className='font-medium'>Kanban-Ansicht</span>
          <span className='text-muted-foreground text-xs'>
            {tripCount} Fahrten – gruppiert nach {groupByLabel}
          </span>
        </div>
      </div>

      {/* Right side: group-by selector + action buttons */}
      <div className='flex items-center gap-2'>
        <Select
          value={groupBy}
          onValueChange={(value: GroupByMode) => onGroupByChange(value)}
        >
          <SelectTrigger className='h-8 w-40 text-xs'>
            <SelectValue placeholder='Gruppieren nach' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='driver' className='text-xs'>
              Fahrer
            </SelectItem>
            <SelectItem value='status' className='text-xs'>
              Status
            </SelectItem>
            <SelectItem value='payer' className='text-xs'>
              Kostenträger
            </SelectItem>
          </SelectContent>
        </Select>

        <div className='flex items-center gap-1.5'>
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground hover:text-foreground h-8 px-3 text-xs'
            disabled={!hasPendingChanges || isSaving}
            onClick={onReset}
          >
            Verwerfen
          </Button>
          <Button
            variant='default'
            size='sm'
            className='h-8 px-3 text-xs'
            disabled={!hasPendingChanges || isSaving}
            onClick={onSave}
          >
            {isSaving ? 'Speichern…' : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}
