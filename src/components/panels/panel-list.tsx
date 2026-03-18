/**
 * PanelList<T>
 *
 * A fully self-contained, generic "first column" list panel. This is the most
 * commonly reused component in the panel system — every entity management page
 * (Clients, Drivers, Vehicles, Payers, etc.) needs exactly this shape.
 *
 * Generic constraint: T must have an `id: string` field so the component can
 * manage selected state and React keys without knowing anything else about T.
 *
 * What it renders:
 *   ┌──────────────────┐
 *   │ [🔍 Suchen...  ] │  ← debounced search input
 *   ├──────────────────┤
 *   │  Item 1         │  ← renderItem(item, isSelected)
 *   │  Item 2 ●       │  ← selected item has bg-muted + left accent border
 *   │  Item 3         │
 *   │  ...            │
 *   ├──────────────────┤
 *   │  [+ New label]   │  ← optional "create new" button (sticky footer)
 *   └──────────────────┘
 *
 * Data-fetching is intentionally outside this component.
 * The parent is responsible for fetching + passing `items`.
 * Use `onSearchChange` to trigger re-fetching when the search term changes.
 *
 * Props:
 *   items            — the list of entities to render (already filtered server-side)
 *   loading          — shows a spinner overlay while true
 *   selectedId       — highlights the item whose id matches
 *   onSelect         — called when an item row is clicked
 *   renderItem       — render prop: receives (item, isSelected) → ReactNode
 *                      wrap in a <button> or a styled div as appropriate
 *   searchValue      — controlled search input value (managed by parent)
 *   onSearchChange   — fired on every keystroke (debounce in the parent or here)
 *   searchPlaceholder— input placeholder text
 *   emptyMessage     — shown when items.length === 0 and not loading
 *   onNew            — if provided, renders a "+ New" button in the footer
 *   newLabel         — label for the new button (default: "Neu")
 *   width            — Tailwind width class (default: "w-[280px]")
 *                      applied to the outer Panel via className
 *
 * Implementation note on renderItem:
 *   The renderItem function should return a <button> or clickable element.
 *   PanelList wraps each item in a container div but does NOT add click handlers
 *   itself — the renderItem output is responsible for selection UX.
 *   This keeps the component flexible: some pages may want keyboard shortcuts,
 *   context menus, or drag handles that PanelList shouldn't know about.
 *
 * Usage example:
 *   <PanelList<Client>
 *     items={clients}
 *     loading={isLoading}
 *     selectedId={nav.values.clientId}
 *     onSelect={(client) => nav.set({ clientId: client.id, ruleId: null })}
 *     renderItem={(client, isSelected) => (
 *       <ClientListItem client={client} isSelected={isSelected} />
 *     )}
 *     searchValue={search}
 *     onSearchChange={setSearch}
 *     searchPlaceholder="Fahrgast suchen..."
 *     onNew={() => nav.set({ clientId: 'new', ruleId: null })}
 *     newLabel="Neuer Fahrgast"
 *   />
 */

'use client';

import * as React from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Panel } from './panel';
import { cn } from '@/lib/utils';

interface PanelListProps<T extends { id: string }> {
  items: T[];
  loading?: boolean;
  selectedId?: string | null;
  onSelect: (item: T) => void;
  /**
   * Render prop for each list item.
   * Return a styled element; PanelList handles the outer container.
   */
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onNew?: () => void;
  newLabel?: string;
  /**
   * Tailwind width class applied to the Panel.
   * Leave unset (default) when wrapped in a ResizablePanel — the panel group
   * controls width. Pass a fixed class (e.g. "w-[280px] shrink-0") only when
   * used outside a resizable layout.
   */
  width?: string;
  className?: string;
}

function PanelList<T extends { id: string }>({
  items,
  loading = false,
  selectedId,
  onSelect,
  renderItem,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Suchen...',
  emptyMessage = 'Keine Einträge gefunden.',
  onNew,
  newLabel = 'Neu',
  width,
  className
}: PanelListProps<T>) {
  return (
    <Panel className={cn('flex-1', width, className)}>
      {/* Search header — always visible, not part of the scroll area */}
      <div className='shrink-0 border-b p-3'>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className='h-8 pl-8 text-sm'
          />
        </div>
      </div>

      {/* Scrollable list body */}
      <div className='min-h-0 flex-1 overflow-y-auto'>
        {loading ? (
          <div className='flex h-24 items-center justify-center'>
            <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
          </div>
        ) : items.length === 0 ? (
          <div className='text-muted-foreground flex h-24 items-center justify-center px-4 text-center text-sm'>
            {emptyMessage}
          </div>
        ) : (
          <div className='py-1'>
            {items.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={cn(
                    'cursor-pointer border-l-2 transition-colors',
                    isSelected
                      ? 'border-l-primary bg-muted/60'
                      : 'hover:bg-muted/30 border-l-transparent'
                  )}
                >
                  {renderItem(item, isSelected)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer — only rendered if onNew is provided */}
      {onNew && (
        <div className='shrink-0 border-t p-3'>
          <Button
            variant='outline'
            size='sm'
            className='w-full'
            onClick={onNew}
          >
            <Plus className='mr-2 h-3.5 w-3.5' />
            {newLabel}
          </Button>
        </div>
      )}
    </Panel>
  );
}

export { PanelList };
export type { PanelListProps };
