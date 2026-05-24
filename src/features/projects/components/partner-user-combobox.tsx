/**
 * @file: partner-user-combobox.tsx
 * @description: Searchable combobox для выбора пользователя-партнёра проекта.
 *               Используется в `referral-commission-plans-panel` для назначения
 *               outbound-плана конкретному тренеру/менеджеру/директору.
 *               Поиск debounced 300ms через
 *               GET /api/projects/{id}/users?search={q}&role=TRAINER,MANAGER,DIRECTOR.
 *               (b2b-referral-hierarchy Phase 6.1–6.3)
 * @project: SaaS Bonus System
 * @dependencies: shadcn/ui Command + Popover, useDebouncedCallback
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Search, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { PartnerRoleBadge } from '@/features/bonuses/components/partner-role-badge';

export type PartnerUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  partnerRole: string;
  outboundReferralPlanId: string | null;
};

interface PartnerUserComboboxProps {
  projectId: string;
  /** Текущий выбранный userId (или пустая строка). */
  value: string;
  /** Колбэк при выборе/очистке (передаёт обогащённого пользователя для UI). */
  onChange: (user: PartnerUser | null) => void;
  /** Включить роль-фильтр (только партнёры). По умолчанию true. */
  partnerRolesOnly?: boolean;
  /**
   * Маппинг planId → planName. Нужен, чтобы под именем пользователя
   * показывать текущий outbound-план (Phase 6.3).
   */
  planNameById?: Record<string, string>;
  disabled?: boolean;
  className?: string;
  /** Плейсхолдер кнопки когда нет выбранного пользователя. */
  placeholder?: string;
}

const FETCH_LIMIT = 20;

/**
 * Поиск + выбор пользователя проекта с фильтром по партнёрской роли.
 * Возвращает обогащённый объект через `onChange`. Если убрать выбор — `null`.
 */
export function PartnerUserCombobox({
  projectId,
  value,
  onChange,
  partnerRolesOnly = true,
  planNameById,
  disabled,
  className,
  placeholder = 'Выберите партнёра…'
}: PartnerUserComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [items, setItems] = React.useState<PartnerUser[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<PartnerUser | null>(null);
  const requestIdRef = React.useRef(0);

  /**
   * Загрузить список (или подгрузить выбранного по value).
   * Используется при открытии Popover и при вводе в поиск.
   */
  const fetchUsers = React.useCallback(
    async (search: string) => {
      const myReqId = ++requestIdRef.current;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', String(FETCH_LIMIT));
        if (search.trim()) params.set('search', search.trim());
        if (partnerRolesOnly) params.set('role', 'TRAINER,MANAGER,DIRECTOR');
        const res = await fetch(
          `/api/projects/${projectId}/users?${params.toString()}`
        );
        if (!res.ok) {
          if (myReqId === requestIdRef.current) setItems([]);
          return;
        }
        const data = await res.json();
        const users: PartnerUser[] = Array.isArray(data?.users)
          ? data.users.map((u: any) => ({
              id: u.id,
              name:
                u.name ||
                `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                u.email ||
                u.phone ||
                u.id,
              email: u.email ?? null,
              phone: u.phone ?? null,
              partnerRole: u.partnerRole ?? 'CLIENT',
              outboundReferralPlanId: u.outboundReferralPlanId ?? null
            }))
          : [];
        // Защита от race condition: учитываем только последний запрос.
        if (myReqId === requestIdRef.current) setItems(users);
      } catch {
        if (myReqId === requestIdRef.current) setItems([]);
      } finally {
        if (myReqId === requestIdRef.current) setLoading(false);
      }
    },
    [projectId, partnerRolesOnly]
  );

  const debouncedFetch = useDebouncedCallback(fetchUsers, 300);

  // При первом открытии и при изменении query вызываем поиск.
  React.useEffect(() => {
    if (!open) return;
    debouncedFetch(query);
  }, [open, query, debouncedFetch]);

  // Если есть value, но нет данных о выбранном пользователе — догружаем профиль.
  React.useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/users/${value}`
        ).catch(() => null);
        if (!res || !res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setSelected({
          id: data.id ?? value,
          name:
            data.name ||
            `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
            data.email ||
            data.phone ||
            value,
          email: data.email ?? null,
          phone: data.phone ?? null,
          partnerRole: data.partnerRole ?? 'CLIENT',
          outboundReferralPlanId: data.outboundReferralPlanId ?? null
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, projectId, selected?.id]);

  const handleSelect = (user: PartnerUser) => {
    setSelected(user);
    onChange(user);
    setOpen(false);
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelected(null);
    onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-[320px] justify-between text-left font-normal',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <span className='flex min-w-0 flex-1 items-center gap-2'>
            {selected ? (
              <>
                <User className='h-4 w-4 shrink-0 opacity-60' />
                <span className='truncate'>{selected.name}</span>
                <PartnerRoleBadge role={selected.partnerRole} />
              </>
            ) : (
              <>
                <Search className='h-4 w-4 shrink-0 opacity-60' />
                <span className='truncate'>{placeholder}</span>
              </>
            )}
          </span>
          {selected ? (
            <span
              role='button'
              tabIndex={0}
              onClick={handleClear}
              className='hover:text-foreground text-muted-foreground ml-2 text-xs'
            >
              Сбросить
            </span>
          ) : (
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[360px] p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Поиск по имени, email, телефону…'
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && (
              <div className='text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Поиск…
              </div>
            )}
            {!loading && items.length === 0 && (
              <CommandEmpty>
                {query
                  ? 'Никого не нашли по запросу'
                  : 'Начните вводить имя или телефон'}
              </CommandEmpty>
            )}
            {!loading && items.length > 0 && (
              <CommandGroup heading='Партнёры'>
                {items.map((u) => {
                  const planName =
                    u.outboundReferralPlanId && planNameById
                      ? planNameById[u.outboundReferralPlanId]
                      : null;
                  const isSelected = selected?.id === u.id;
                  return (
                    <CommandItem
                      key={u.id}
                      value={u.id}
                      onSelect={() => handleSelect(u)}
                      className='flex items-start gap-2'
                    >
                      <Check
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                        <div className='flex items-center gap-2'>
                          <span className='truncate font-medium'>{u.name}</span>
                          <PartnerRoleBadge role={u.partnerRole} />
                        </div>
                        <div className='text-muted-foreground truncate text-xs'>
                          {u.email || u.phone || u.id}
                        </div>
                        {planName ? (
                          <div className='text-muted-foreground text-xs'>
                            <span className='font-medium'>Текущий план:</span>{' '}
                            {planName}
                          </div>
                        ) : u.outboundReferralPlanId ? (
                          <div className='text-muted-foreground text-xs'>
                            <span className='font-medium'>Текущий план:</span>{' '}
                            (есть назначение)
                          </div>
                        ) : (
                          <div className='text-muted-foreground/70 text-xs italic'>
                            план не назначен
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
