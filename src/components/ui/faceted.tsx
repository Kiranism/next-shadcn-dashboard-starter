'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';
import * as React from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconChevronDown, IconSearch, IconCheck } from '@tabler/icons-react';

type FacetedSelectedValue<Multiple extends boolean> = Multiple extends true ? string[] : string;

interface FacetedOption {
  label: string;
  value: string;
}

const NO_ITEMS: FacetedOption[] = [];

interface FacetedStoreState {
  value: string | string[] | undefined;
  items: FacetedOption[];
  multiple: boolean;
}

interface FacetedController {
  isValueControlled: boolean;
  onValueChange?: (value: string | string[] | undefined) => void;
  setOpen: (open: boolean) => void;
}

interface FacetedStore {
  controller: FacetedController;
  setController: (controller: FacetedController) => void;
  subscribe: (callback: () => void) => () => void;
  getState: () => FacetedStoreState;
  notify: () => void;
  sync: (changes: Partial<FacetedStoreState>) => void;
  setOpen: (open: boolean) => void;
  selectItem: (value: string) => void;
  clear: () => void;
}

function getIsValueSelected(
  value: string | string[] | undefined,
  multiple: boolean,
  itemValue: string
) {
  if (multiple) return Array.isArray(value) && value.includes(itemValue);
  return value === itemValue;
}

const labelsCache = new WeakMap<FacetedOption[], Map<string, string>>();

function getLabels(items: FacetedOption[]) {
  let labels = labelsCache.get(items);
  if (!labels) {
    labels = new Map(items.map((item) => [item.value, item.label]));
    labelsCache.set(items, labels);
  }
  return labels;
}

function getSelectedValues(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function getSelectedItems(values: string[], items: FacetedOption[]): FacetedOption[] {
  const labels = getLabels(items);

  return values.map((value) => ({
    label: labels.get(value) ?? value,
    value
  }));
}

function getIsFacetedSelectedValue<Multiple extends boolean>(
  value: string | string[] | undefined,
  multiple: Multiple
): value is FacetedSelectedValue<Multiple> | undefined {
  if (value === undefined) return true;
  return multiple ? Array.isArray(value) : typeof value === 'string';
}

function createFacetedStore(state: FacetedStoreState): FacetedStore {
  const listeners = new Set<() => void>();

  function commitValue(nextValue: string | string[] | undefined) {
    store.controller.onValueChange?.(nextValue);
    if (!store.controller.isValueControlled && !Object.is(state.value, nextValue)) {
      state.value = nextValue;
      store.notify();
    }
  }

  const store: FacetedStore = {
    controller: {
      isValueControlled: false,
      setOpen: () => {}
    },
    setController: (controller) => {
      store.controller = controller;
    },
    subscribe: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    getState: () => state,
    notify: () => {
      for (const callback of listeners) {
        callback();
      }
    },
    sync: (changes) => {
      let hasChanged = false;
      for (const key of Object.keys(changes) as (keyof FacetedStoreState)[]) {
        if (Object.is(state[key], changes[key])) continue;
        Object.assign(state, { [key]: changes[key] });
        hasChanged = true;
      }
      if (hasChanged) store.notify();
    },
    setOpen: (open) => store.controller.setOpen(open),
    selectItem: (selectedValue) => {
      if (state.multiple) {
        const selected = Array.isArray(state.value) ? state.value : [];
        commitValue(
          selected.includes(selectedValue)
            ? selected.filter((item) => item !== selectedValue)
            : [...selected, selectedValue]
        );
        return;
      }

      commitValue(state.value === selectedValue ? undefined : selectedValue);
      store.setOpen(false);
    },
    clear: () => {
      commitValue(state.multiple ? [] : undefined);
    }
  };

  return store;
}

function useFacetedStoreSelector<T>(
  store: FacetedStore,
  selector: (state: FacetedStoreState) => T
): T {
  const getSnapshot = () => selector(store.getState());
  return React.useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

const FacetedStoreContext = React.createContext<FacetedStore | null>(null);

function useFacetedStore(name: string) {
  const store = React.useContext(FacetedStoreContext);
  if (!store) {
    throw new Error(`\`${name}\` must be used within \`Faceted\`.`);
  }
  return store;
}

interface FacetedProps<Multiple extends boolean = false> extends Omit<
  React.ComponentProps<typeof Popover>,
  'onOpenChange'
> {
  value?: FacetedSelectedValue<Multiple>;
  defaultValue?: FacetedSelectedValue<Multiple>;
  onValueChange?: (value: FacetedSelectedValue<Multiple> | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  items?: FacetedOption[];
  multiple?: Multiple;
}

function Faceted<Multiple extends boolean = false>({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  value,
  defaultValue,
  onValueChange,
  items = NO_ITEMS,
  multiple = false as Multiple,
  ...props
}: FacetedProps<Multiple>) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = openProp ?? internalOpen;

  const [store] = React.useState(() =>
    createFacetedStore({ value: value ?? defaultValue, items, multiple })
  );

  // Local patch: set through a store method; assigning to a useState value trips react/immutability
  useIsoLayoutEffect(() => {
    store.setController({
      isValueControlled: value !== undefined,
      onValueChange(nextValue) {
        if (!getIsFacetedSelectedValue(nextValue, multiple)) return;
        onValueChange?.(nextValue);
      },
      setOpen(nextOpen) {
        onOpenChange?.(nextOpen);
        if (openProp === undefined) setInternalOpen(nextOpen);
      }
    });
  });

  const wasValueControlledRef = React.useRef(value !== undefined);

  useIsoLayoutEffect(() => {
    const isValueControlled = value !== undefined;
    store.sync(
      isValueControlled || wasValueControlledRef.current
        ? { value, items, multiple }
        : { items, multiple }
    );
    wasValueControlledRef.current = isValueControlled;
  }, [store, value, items, multiple]);

  return (
    <FacetedStoreContext.Provider value={store}>
      <Popover data-slot='faceted' open={open} onOpenChange={store.setOpen} {...props} />
    </FacetedStoreContext.Provider>
  );
}

function FacetedTrigger({ className, ...props }: React.ComponentProps<typeof PopoverTrigger>) {
  return (
    <PopoverTrigger
      data-slot='faceted-trigger'
      className={cn(
        'justify-between text-left has-[>[data-slot=faceted-value]]:transition-[color,background-color,border-color,box-shadow] has-[>[data-slot=faceted-value]>[data-slot=faceted-badge-list]]:pl-1',
        className
      )}
      {...props}
    />
  );
}

interface FacetedValueProps {
  placeholder?: React.ReactNode;
  children?: React.ReactNode | ((selected: FacetedOption[]) => React.ReactNode);
}

function FacetedValue({ placeholder = 'Select options...', children }: FacetedValueProps) {
  const store = useFacetedStore('FacetedValue');
  const value = useFacetedStoreSelector(store, (state) => state.value);
  const items = useFacetedStoreSelector(store, (state) => state.items);
  const multiple = useFacetedStoreSelector(store, (state) => state.multiple);
  const values = getSelectedValues(value);

  if (typeof children === 'function') {
    return children(getSelectedItems(values, items));
  }
  if (children != null) return children;

  const selected = multiple && values.length > 2 ? [] : getSelectedItems(values, items);
  const [item] = selected;

  return (
    <span
      data-slot='faceted-value'
      className={cn(
        'flex w-full min-w-0 items-center gap-1',
        values.length === 0 && 'text-muted-foreground'
      )}
    >
      {multiple && values.length > 0 ? (
        <FacetedBadgeList>
          {values.length > 2 ? (
            <FacetedBadge>{values.length} selected</FacetedBadge>
          ) : (
            selected.map((selectedItem) => (
              <FacetedBadge key={selectedItem.value}>
                <span className='truncate'>{selectedItem.label}</span>
              </FacetedBadge>
            ))
          )}
        </FacetedBadgeList>
      ) : (
        <span className='truncate'>{item ? item.label : placeholder}</span>
      )}
      <IconChevronDown className='ml-auto size-4 shrink-0 text-muted-foreground' />
    </span>
  );
}

function FacetedBadgeList({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='faceted-badge-list'
      className={cn('flex w-max max-w-full flex-wrap items-center gap-1', className)}
      {...props}
    />
  );
}

function FacetedBadge({ className, render, ...props }: useRender.ComponentProps<'span'>) {
  return useRender({
    defaultTagName: 'span',
    render,
    state: {
      slot: 'faceted-badge'
    },
    props: mergeProps<'span'>(
      {
        className: cn(
          'flex h-[calc(--spacing(5.25))] w-fit max-w-full min-w-0 items-center justify-center gap-1 rounded-sm bg-input/60 px-1.5 text-xs font-medium whitespace-nowrap text-foreground [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0',
          className
        )
      },
      props
    )
  });
}

interface FacetedContentProps
  extends
    React.ComponentProps<typeof PopoverContent>,
    Pick<React.ComponentProps<typeof Command>, 'shouldFilter' | 'filter' | 'loop'> {}

function FacetedContent({
  className,
  children,
  shouldFilter,
  filter,
  loop,
  ...props
}: FacetedContentProps) {
  return (
    <PopoverContent
      data-slot='faceted-content'
      align='start'
      className={cn('w-50 origin-(--transform-origin) p-0', className)}
      {...props}
    >
      <Command shouldFilter={shouldFilter} filter={filter} loop={loop} className='p-0.5'>
        {children}
      </Command>
    </PopoverContent>
  );
}

interface FacetedInputProps extends React.ComponentProps<typeof CommandPrimitive.Input> {
  variant?: 'default' | 'line';
}

function FacetedInput({ variant = 'default', className, ref, ...props }: FacetedInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const composedRef = useMergedRefs(ref, inputRef);

  React.useEffect(() => {
    const input = inputRef.current;
    const root = input?.closest('[cmdk-root]');
    if (!input || !root) return;

    // cmdk's own aria-activedescendant lags behind the highlighted item.
    const onSync = () => {
      const id = root.querySelector("[cmdk-item][aria-selected='true']")?.id;
      if (!id) {
        input.removeAttribute('aria-activedescendant');
        return;
      }
      if (input.getAttribute('aria-activedescendant') !== id) {
        input.setAttribute('aria-activedescendant', id);
      }
    };

    onSync();
    const observer = new MutationObserver(onSync);
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributeFilter: ['aria-selected', 'aria-activedescendant']
    });
    return () => observer.disconnect();
  }, []);

  if (variant === 'line') {
    return (
      <div
        data-slot='faceted-input-wrapper'
        data-variant='line'
        className='-mx-0.5 -mt-0.5 mb-0.5 flex h-9 items-center gap-2 border-b px-3.5'
      >
        <IconSearch className='size-4 shrink-0 text-muted-foreground' />
        <CommandPrimitive.Input
          ref={composedRef}
          data-slot='faceted-input'
          className={cn(
            'h-full w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
      </div>
    );
  }

  return (
    <CommandInput ref={composedRef} data-slot='faceted-input' className={className} {...props} />
  );
}

function FacetedList({ ...props }: React.ComponentProps<typeof CommandList>) {
  return <CommandList data-slot='faceted-list' {...props} />;
}

function FacetedEmpty({ ...props }: React.ComponentProps<typeof CommandEmpty>) {
  return <CommandEmpty data-slot='faceted-empty' {...props} />;
}

function FacetedLoading({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Loading>) {
  return (
    <CommandPrimitive.Loading
      data-slot='faceted-loading'
      className={cn('py-6 text-center text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function FacetedGroup({ ...props }: React.ComponentProps<typeof CommandGroup>) {
  return <CommandGroup data-slot='faceted-group' {...props} />;
}

function FacetedCommandItem({
  className,
  onPointerDownCapture,
  onMouseDown,
  onSelect,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-muted data-[selected=true]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[selected=true]:*:[svg]:text-foreground",
        className
      )}
      {...mergeProps<'div'>(
        {
          onPointerDownCapture(event) {
            // A focusable item steals the input on pointerdown.
            event.preventDefault();
            if (event.pointerType === 'touch') return;
            event.currentTarget
              .closest('[cmdk-root]')
              ?.querySelector<HTMLInputElement>('[cmdk-input]')
              ?.focus();
          },
          onMouseDown(event) {
            // iOS Safari can emit a synthetic mousedown without a pointerdown.
            event.preventDefault();
          }
        },
        { onPointerDownCapture, onMouseDown }
      )}
      onSelect={onSelect}
      {...props}
    />
  );
}

interface FacetedItemProps extends React.ComponentProps<typeof CommandPrimitive.Item> {
  value: string;
}

function FacetedItem({ value, onSelect, ...props }: FacetedItemProps) {
  const store = useFacetedStore('FacetedItem');
  const isSelected = useFacetedStoreSelector(store, (state) =>
    getIsValueSelected(state.value, state.multiple, value)
  );

  return (
    <FacetedCommandItem
      data-slot='faceted-item'
      data-checked={isSelected || undefined}
      aria-checked={isSelected}
      onSelect={() => {
        if (onSelect) {
          onSelect(value);
          return;
        }
        store.selectItem(value);
      }}
      {...props}
    />
  );
}

function FacetedItemIndicator({ className, children, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='faceted-item-indicator'
      className={cn('ml-auto grid place-items-center *:col-start-1 *:row-start-1', className)}
      {...props}
    >
      {children != null && (
        <span className='font-mono text-xs group-data-checked/command-item:invisible'>
          {children}
        </span>
      )}
      <IconCheck className='invisible group-data-checked/command-item:visible' />
    </span>
  );
}

function FacetedClear({
  className,
  children = 'Clear',
  onSelect,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  const store = useFacetedStore('FacetedClear');
  const hasSelection = useFacetedStoreSelector(
    store,
    (state) => getSelectedValues(state.value).length > 0
  );

  if (!hasSelection) return null;

  return (
    <>
      <FacetedSeparator />
      <FacetedGroup>
        <FacetedCommandItem
          data-slot='faceted-clear'
          className={cn('justify-center text-center', className)}
          onSelect={(value) => {
            onSelect?.(value);
            store.clear();
          }}
          {...props}
        >
          {children}
        </FacetedCommandItem>
      </FacetedGroup>
    </>
  );
}

function FacetedSeparator({ ...props }: React.ComponentProps<typeof CommandSeparator>) {
  return (
    <CommandSeparator
      data-slot='faceted-separator'
      aria-hidden='true'
      className='mx-0 my-0.5 w-full'
      {...props}
    />
  );
}

export {
  Faceted,
  FacetedBadge,
  FacetedBadgeList,
  FacetedClear,
  FacetedContent,
  FacetedEmpty,
  FacetedGroup,
  FacetedInput,
  FacetedItem,
  FacetedItemIndicator,
  FacetedList,
  FacetedLoading,
  FacetedSeparator,
  FacetedTrigger,
  FacetedValue
};
