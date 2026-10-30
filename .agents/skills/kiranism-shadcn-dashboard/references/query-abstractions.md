# TanStack Query Abstractions (v5)

The core insight: **`queryOptions` and `mutationOptions` are the right abstraction — not custom hooks.** This starter follows TanStack's official Next.js examples: one `queries.ts` per feature exporting `entityQueries` and `entityMutations`.

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

Shared `mutationOptions` contain **only the `mutationFn`**. This is how TanStack's official [Next.js optimistic updates example](https://github.com/TanStack/query/blob/main/examples/react/nextjs-app-optimistic-updates/services/todos/queries.ts) defines `todosMutations`:

```ts
// features/invoices/api/queries.ts (next to invoiceQueries)
import { mutationOptions } from '@tanstack/react-query';

export const invoiceMutations = {
  create: () =>
    mutationOptions({
      mutationFn: (data: CreateInvoiceInput) => createInvoice(data)
    }),
  update: () =>
    mutationOptions({
      mutationFn: ({ id, ...data }: UpdateInvoiceInput) => updateInvoice(id, data)
    })
};
```

### Usage — the component owns everything after the mutation

```ts
const queryClient = useQueryClient();

const { mutate } = useMutation({
  ...invoiceMutations.create(),
  onSuccess: (data) => router.push(`/invoices/${data.id}`),
  onError: (err) => toast.error(err.message),
  onSettled: () => queryClient.invalidateQueries({ queryKey: invoiceQueries.all() })
});
```

### Why no callbacks in shared `mutationOptions`

`useMutation({ ...options, onSuccess })` is plain object spread. A component's `onSuccess` **replaces** the shared one; it does not run after it. If invalidation lives in the shared options, it silently disappears the moment a component adds a toast, and tables stay stale until a reload. Keeping callbacks out of the shared options means there is exactly one owner for "what happens after": the component.

---

## Rules Summary

| Rule                                                          | Reason                                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Use `queryOptions()` not custom hooks as the base abstraction | Works everywhere — loaders, server, imperative calls                   |
| Keep options factories lean — no extra config params          | Best abstractions are not configurable                                 |
| Compose extra options at the call site via spread             | Full TS inference without manual generics                              |
| Shared `mutationOptions` hold only `mutationFn`               | A component's `onSuccess` would replace shared callbacks via spread    |
| Invalidate in the component (`useQueryClient()`, `onSettled`) | One visible owner for everything after the mutation                    |
| Co-locate `queryKey` inside `queryOptions`                    | Typed key reuse in `invalidateQueries`, `setQueryData`, `getQueryData` |
| Custom hooks are fine — but built ON TOP of `queryOptions`    | Hooks for component convenience, `queryOptions` for sharing config     |
