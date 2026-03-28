# TanStack Query Abstractions (v5)

The core insight: **`queryOptions` and `mutationOptions` are the right abstraction — not custom hooks.**

---

## Query Abstraction

### The Pattern

```ts
// queries/invoice.ts
import { queryOptions } from '@tanstack/react-query';

export function invoiceOptions(id: number) {
  return queryOptions({
    queryKey: ['invoice', id],
    queryFn: () => fetchInvoice(id)
  });
}

export function invoiceListOptions(filters: InvoiceFilters) {
  return queryOptions({
    queryKey: ['invoices', filters],
    queryFn: () => fetchInvoices(filters),
    staleTime: 30_000
  });
}
```

### Usage — always compose at the call site

```ts
// basic
const { data } = useQuery(invoiceOptions(id));

// with suspense — same options, different hook
const { data } = useSuspenseQuery(invoiceOptions(id));

// with extra options spread on top — full type inference, no TS pain
const { data } = useQuery({
  ...invoiceOptions(id),
  select: (invoice) => invoice.createdAt, // data infers as string | undefined
  enabled: !!id
});

// prefetch in a route loader (works outside React — this is why hooks are wrong)
await queryClient.prefetchQuery(invoiceOptions(id));

// read from cache imperatively — queryKey is typed via DataTag symbol
const invoice = queryClient.getQueryData(invoiceOptions(id).queryKey);

// invalidate
queryClient.invalidateQueries({ queryKey: invoiceOptions(id).queryKey });
```

### Why NOT a custom hook

Custom hooks like `useInvoice(id)` have three critical problems:

1. **Hooks only work in components/hooks** — but queries are now used in route loaders, server prefetching, event handlers, and server components. `queryOptions` is just a plain function — works anywhere.
2. **They share logic, not configuration** — what you actually want to share is the `queryKey` + `queryFn` config. Hooks are the wrong primitive for that.
3. **They lock you to one hook** — you can't use `useInvoice()` with `useSuspenseQuery`, `useQueries`, or imperative `queryClient` methods.

### Why NOT `UseQueryOptions` type directly

```ts
// BAD — data becomes unknown
function useInvoice(id: number, options?: Partial<UseQueryOptions>) { ... }

// STILL BAD — select breaks with TS error
function useInvoice(id: number, options?: Partial<UseQueryOptions<Invoice>>) { ... }
// select: (invoice) => invoice.createdAt
// Error: Type 'string' is not assignable to type 'Invoice'
```

`queryOptions` solves this via a `DataTag` symbol on the queryKey — full inference, zero manual generics.

### Custom hooks are still fine on top

If a component always uses the same composition, a hook is fine — but build it _on top of_ `queryOptions`:

```ts
// OK — hook built on queryOptions
function useInvoice(id: number) {
  return useQuery(invoiceOptions(id));
}

// OK — hook that adds per-feature defaults
function useInvoiceWithSuspense(id: number) {
  return useSuspenseQuery(invoiceOptions(id));
}
```

---

## Mutation Abstraction

### The Pattern

```ts
// mutations/invoice.ts
import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';

export const createInvoiceMutation = mutationOptions({
  mutationFn: (data: CreateInvoiceInput) => createInvoice(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: ['invoices'] });
  }
});

export const updateInvoiceMutation = mutationOptions({
  mutationFn: ({ id, ...data }: UpdateInvoiceInput) => updateInvoice(id, data),
  onSuccess: (updated) => {
    const qc = getQueryClient();
    qc.setQueryData(invoiceOptions(updated.id).queryKey, updated);
    qc.invalidateQueries({ queryKey: ['invoices'] });
  }
});
```

> **Note on queryClient**: Import `getQueryClient()` directly — do NOT pass `queryClient` as a function argument. The `getQueryClient()` pattern handles both SSR (fresh per request) and client (singleton) correctly.

### Usage

```ts
// basic
const { mutate } = useMutation(createInvoiceMutation);

// composed — add per-usage callbacks on top
const { mutate } = useMutation({
  ...createInvoiceMutation,
  onError: (err) => toast.error(err.message),
  onSuccess: (data) => {
    // this runs AFTER the shared onSuccess above
    router.push(`/invoices/${data.id}`);
  }
});
```

---

## Rules Summary

| Rule                                                          | Reason                                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Use `queryOptions()` not custom hooks as the base abstraction | Works everywhere — loaders, server, imperative calls                   |
| Keep options factories lean — no extra config params          | Best abstractions are not configurable                                 |
| Compose extra options at the call site via spread             | Full TS inference without manual generics                              |
| Import `getQueryClient()` in mutation files                   | Handles SSR/client correctly without prop drilling                     |
| Co-locate `queryKey` inside `queryOptions`                    | Typed key reuse in `invalidateQueries`, `setQueryData`, `getQueryData` |
| Custom hooks are fine — but built ON TOP of `queryOptions`    | Hooks for component convenience, `queryOptions` for sharing config     |
