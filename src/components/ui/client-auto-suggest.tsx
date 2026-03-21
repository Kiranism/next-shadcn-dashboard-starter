'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, User, Building2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import type { ClientOption } from '@/features/trips/hooks/use-trip-form-data';

interface ClientAutoSuggestProps {
  onSelect: (client: ClientOption | null) => void;
  onNameChange: (name: string) => void;
  searchClients: (query: string) => Promise<ClientOption[]>;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  getDisplayValue?: (client: ClientOption) => string;
  /** Merged onto the search input (e.g. compact height in stacked forms). */
  inputClassName?: string;
  /**
   * When the trigger sits in a narrow column, matching its width makes the
   * results list feel cramped. This uses a comfortable min width instead.
   */
  widePopover?: boolean;
}

export function ClientAutoSuggest({
  onSelect,
  onNameChange,
  searchClients,
  value = '',
  placeholder = 'Name eingeben...',
  disabled = false,
  getDisplayValue,
  inputClassName,
  widePopover = false
}: ClientAutoSuggestProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const [results, setResults] = React.useState<ClientOption[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedClient, setSelectedClient] =
    React.useState<ClientOption | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  React.useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onNameChange(val);
    setSelectedClient(null);
    onSelect(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length >= 2) {
      setIsSearching(true);
      setOpen(true);
      debounceRef.current = setTimeout(async () => {
        const data = await searchClients(val);
        setResults(data);
        setIsSearching(false);
      }, 300);
    } else {
      setResults([]);
      setOpen(false);
    }
  };

  const handleSelect = (client: ClientOption) => {
    const displayName = getDisplayValue
      ? getDisplayValue(client)
      : client.is_company
        ? client.company_name || ''
        : [client.first_name, client.last_name].filter(Boolean).join(' ');
    setQuery(displayName);
    onNameChange(displayName);
    setSelectedClient(client);
    onSelect(client);
    setOpen(false);
  };

  const getClientDisplayName = (client: ClientOption) => {
    return client.is_company
      ? client.company_name || 'Unbekannt'
      : [client.first_name, client.last_name].filter(Boolean).join(' ') ||
          'Unbekannt';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className='relative w-full'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn('pl-9', inputClassName)}
            onFocus={() => results.length > 0 && setOpen(true)}
          />
          {selectedClient && (
            <Check className='text-primary absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2' />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'p-0',
          widePopover
            ? 'w-[var(--radix-popover-trigger-width)] sm:w-[min(22rem,calc(100vw-1.5rem))] sm:max-w-[calc(100vw-1rem)]'
            : 'w-[var(--radix-popover-trigger-width)]'
        )}
        align='start'
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div
          className={cn(
            'overflow-y-auto py-1',
            widePopover ? 'max-h-[min(24rem,50vh)]' : 'max-h-64'
          )}
        >
          {isSearching ? (
            <div className='text-muted-foreground py-4 text-center text-sm'>
              Suche...
            </div>
          ) : results.length === 0 ? (
            <div className='text-muted-foreground py-4 text-center text-sm'>
              <div className='font-medium'>Kein Kunde gefunden</div>
              <div className='mt-1 text-xs opacity-70'>
                Neuer Fahrgast ohne Speicherung
              </div>
            </div>
          ) : (
            results.map((client) => (
              <button
                key={client.id}
                type='button'
                onClick={() => handleSelect(client)}
                className={cn(
                  'hover:bg-accent flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors',
                  selectedClient?.id === client.id && 'bg-accent'
                )}
              >
                <div className='bg-primary/10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full'>
                  {client.is_company ? (
                    <Building2 className='text-primary h-3.5 w-3.5' />
                  ) : (
                    <User className='text-primary h-3.5 w-3.5' />
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='truncate text-sm font-medium'>
                      {getClientDisplayName(client)}
                    </span>
                    {selectedClient?.id === client.id && (
                      <Check className='text-primary h-3.5 w-3.5 shrink-0' />
                    )}
                  </div>
                  <div className='text-muted-foreground truncate text-xs'>
                    {client.street} {client.street_number}, {client.zip_code}{' '}
                    {client.city}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
