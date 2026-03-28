---
name: kiranism-shadcn-dashboard
description: |
  Guide for building features, pages, tables, forms, themes, and navigation in this Next.js 16 shadcn dashboard template. Use this skill whenever the user wants to add a new page, create a feature module, build a data table, add a form, configure navigation items, add a theme, set up RBAC access control, or work with the dashboard's patterns and conventions. Also triggers when adding routes under /dashboard, working with Clerk auth/orgs/billing, creating mock APIs, or modifying the sidebar. Even if the user doesn't mention "dashboard" explicitly — if they're adding UI, pages, or features to this project, use this skill.
---

# Dashboard Development Guide

This skill encodes the exact patterns and conventions used in this Next.js 16 + shadcn/ui admin dashboard template.

## Quick Reference: What Goes Where

| Task                  | Location                                |
| --------------------- | --------------------------------------- |
| New page              | `src/app/dashboard/<name>/page.tsx`     |
| New feature module    | `src/features/<name>/`                  |
| Feature components    | `src/features/<name>/components/`       |
| API types             | `src/features/<name>/api/types.ts`      |
| Service layer         | `src/features/<name>/api/service.ts`    |
| Query options         | `src/features/<name>/api/queries.ts`    |
| Mutation options      | `src/features/<name>/api/mutations.ts`  |
| Zod schemas           | `src/features/<name>/schemas/<name>.ts` |
| Filter/select options | `src/features/<name>/constants/`        |
| Nav config            | `src/config/nav-config.ts`              |
| Types                 | `src/types/index.ts`                    |
| Mock data             | `src/constants/mock-api-<name>.ts`      |
| Search params         | `src/lib/searchparams.ts`               |
| Query client          | `src/lib/query-client.ts`               |
| Theme CSS             | `src/styles/themes/<name>.css`          |
| Theme registry        | `src/components/themes/theme.config.ts` |
| Custom hook           | `src/hooks/`                            |
| Icons registry        | `src/components/icons.tsx`              |

---

## Adding a New Feature (End-to-End)

When a user asks to add a feature (e.g., "add an orders page"), follow these steps in order. Each step below shows the minimal pattern — see reference files for full templates.

### Step 1: Mock API (`src/constants/mock-api-<name>.ts`)

See [references/mock-api-guide.md](references/mock-api-guide.md) for the complete template. Key structure:

```tsx
import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter';
import { delay } from './mock-api';

export type Order = {
  id: number;
  customer: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
};

export const fakeOrders = {
  records: [] as Order[],
  initialize() {
    /* generate with faker */
  },
  async getOrders({ page, limit, search, sort }) {
    /* filter, sort, paginate, return { items, total_items } */
  },
  async getOrderById(id: number) {
    /* find by id */
  },
  async createOrder(data) {
    /* push to records */
  },
  async updateOrder(id, data) {
    /* merge into record */
  },
  async deleteOrder(id) {
    /* filter out */
  }
};
fakeOrders.initialize();
```

Every method should call `await delay(800)` to simulate network latency. Use `matchSorter` for search. Return `{ items, total_items }` from list methods.

### Step 2: API Layer (`src/features/<name>/api/`)

Each feature has 4 API files: **types** → **service** → **queries** → **mutations**.

**Types** (`api/types.ts`) — re-export the entity type from mock API, plus filter/response/payload types:

```tsx
export type { Order } from '@/constants/mock-api-orders';
export type OrderFilters = { page?: number; limit?: number; search?: string; sort?: string };
export type OrdersResponse = { items: Order[]; total_items: number };
export type OrderMutationPayload = { customer: string; status: string; total: number };
```

**Service** (`api/service.ts`) — data access layer. One exported function per operation:

```tsx
import { fakeOrders } from '@/constants/mock-api-orders';
import type { OrderFilters, OrdersResponse, OrderMutationPayload } from './types';

export async function getOrders(filters: OrderFilters): Promise<OrdersResponse> {
  return fakeOrders.getOrders(filters);
}
export async function getOrderById(id: number) {
  return fakeOrders.getOrderById(id);
}
export async function createOrder(data: OrderMutationPayload) {
  return fakeOrders.createOrder(data);
}
export async function updateOrder(id: number, data: OrderMutationPayload) {
  return fakeOrders.updateOrder(id, data);
}
export async function deleteOrder(id: number) {
  return fakeOrders.deleteOrder(id);
}
```

**Queries** (`api/queries.ts`) — query key factory + query options:

```tsx
import { queryOptions } from '@tanstack/react-query';
import { getOrders, getOrderById } from './service';
import type { Order, OrderFilters } from './types';

export type { Order };

export const orderKeys = {
  all: ['orders'] as const,
  list: (filters: OrderFilters) => [...orderKeys.all, 'list', filters] as const,
  detail: (id: number) => [...orderKeys.all, 'detail', id] as const
};

export const ordersQueryOptions = (filters: OrderFilters) =>
  queryOptions({
    queryKey: orderKeys.list(filters),
    queryFn: () => getOrders(filters)
  });

export const orderByIdOptions = (id: number) =>
  queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrderById(id)
  });
```

**Mutations** (`api/mutations.ts`) — use `mutationOptions` + `getQueryClient()` (not custom hooks with `useQueryClient()`):

```tsx
import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createOrder, updateOrder, deleteOrder } from './service';
import { orderKeys } from './queries';
import type { OrderMutationPayload } from './types';

export const createOrderMutation = mutationOptions({
  mutationFn: (data: OrderMutationPayload) => createOrder(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

export const updateOrderMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: OrderMutationPayload }) =>
    updateOrder(id, values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

export const deleteOrderMutation = mutationOptions({
  mutationFn: (id: number) => deleteOrder(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});
```

`mutationOptions` is the right abstraction because it works outside React (event handlers, tests, utilities), composes via spread at the call site, and uses `getQueryClient()` which handles both SSR (fresh per request) and client (singleton) correctly. See [references/query-abstractions.md](references/query-abstractions.md) for the full rationale.

### Step 3: Zod Schema (`src/features/<name>/schemas/<name>.ts`)

```tsx
import { z } from 'zod';

export const orderSchema = z.object({
  customer: z.string().min(2, 'Customer name must be at least 2 characters'),
  status: z.string().min(1, 'Please select a status'),
  total: z.number({ message: 'Total is required' })
});

export type OrderFormValues = z.infer<typeof orderSchema>;
```

### Step 4: Feature Components

Create `src/features/<name>/components/` with:

**Listing page** (server component — `<name>-listing.tsx`):

```tsx
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { ordersQueryOptions } from '../api/queries';
import { OrderTable, OrderTableSkeleton } from './orders-table';
import { Suspense } from 'react';

export default function OrderListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(ordersQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<OrderTableSkeleton />}>
        <OrderTable />
      </Suspense>
    </HydrationBoundary>
  );
}
```

**Table + skeleton** (client component — `orders-table/index.tsx`):

```tsx
'use client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { Skeleton } from '@/components/ui/skeleton';
import { ordersQueryOptions } from '../../api/queries';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function OrderTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data } = useSuspenseQuery(ordersQueryOptions(filters));

  const { table } = useDataTable({
    data: data.items,
    columns,
    pageCount: Math.ceil(data.total_items / params.perPage),
    shallow: true,
    debounceMs: 500,
    initialState: { columnPinning: { right: ['actions'] } }
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function OrderTableSkeleton() {
  return (
    <div className='space-y-4 p-4'>
      <Skeleton className='h-10 w-full' />
      <Skeleton className='h-96 w-full' />
    </div>
  );
}
```

**Column definitions** (`orders-table/columns.tsx`):

Each column needs `id`, `accessorKey` (or `accessorFn`), `header` with `DataTableColumnHeader`, and optionally `meta` for filtering + `enableColumnFilter: true`.

```tsx
export const columns: ColumnDef<Order>[] = [
  {
    id: 'customer',
    accessorKey: 'customer',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Customer' />,
    meta: { label: 'Customer', placeholder: 'Search...', variant: 'text', icon: Icons.text },
    enableColumnFilter: true
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    cell: ({ cell }) => (
      <Badge variant='outline' className='capitalize'>
        {cell.getValue<string>()}
      </Badge>
    ),
    enableColumnFilter: true,
    meta: { label: 'Status', variant: 'multiSelect', options: STATUS_OPTIONS }
  },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> }
];
```

Filter `meta.variant` options: `text`, `number`, `range`, `date`, `dateRange`, `select`, `multiSelect`, `boolean`. For multiSelect, provide `options: { value, label, icon? }[]`.

**Cell actions** (`orders-table/cell-action.tsx`):

Pattern: `DropdownMenu` with edit/delete items + `AlertModal` for delete confirmation + `useMutation` for the delete API call.

```tsx
import { deleteOrderMutation } from '../../api/mutations';

export const CellAction: React.FC<{ data: Order }> = ({ data }) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useMutation({
    ...deleteOrderMutation,
    onSuccess: () => {
      toast.success('Deleted');
      setDeleteOpen(false);
    }
  });
  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/orders/${data.id}`)}>
            <Icons.edit className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <Icons.trash className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
```

For **sheet-based editing** (like Users), replace `router.push` with opening a `<FormSheet>` — see the Forms section below.

### Step 5: Page Route (`src/app/dashboard/<name>/page.tsx`)

```tsx
import PageContainer from '@/components/layout/page-container';
import OrderListingPage from '@/features/orders/components/order-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Dashboard: Orders' };
type PageProps = { searchParams: Promise<SearchParams> };

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Orders'
      pageDescription='Manage your orders.'
      pageHeaderAction={/* Add button — Link or SheetTrigger */}
    >
      <OrderListingPage />
    </PageContainer>
  );
}
```

**PageContainer props**: `scrollable`, `pageTitle`, `pageDescription`, `pageHeaderAction` (React node for the top-right button), `infoContent` (help sidebar), `access` + `accessFallback` (RBAC gating).

**Detail/Edit page** (`src/app/dashboard/<name>/[id]/page.tsx`):

```tsx
import PageContainer from '@/components/layout/page-container';
import OrderViewPage from '@/features/orders/components/order-view-page';

export const metadata = { title: 'Dashboard: Order Details' };
type PageProps = { params: Promise<{ id: string }> };

export default async function Page(props: PageProps) {
  const { id } = await props.params;
  return (
    <PageContainer scrollable pageTitle='Order Details'>
      <OrderViewPage orderId={id} />
    </PageContainer>
  );
}
```

**View page component** (client — handles new vs edit):

```tsx
'use client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { orderByIdOptions } from '../api/queries';
import OrderForm from './order-form';

export default function OrderViewPage({ orderId }: { orderId: string }) {
  if (orderId === 'new') return <OrderForm initialData={null} pageTitle='Create Order' />;
  const { data } = useSuspenseQuery(orderByIdOptions(Number(orderId)));
  if (!data) notFound();
  return <OrderForm initialData={data} pageTitle='Edit Order' />;
}
```

### Step 6: Search Params (`src/lib/searchparams.ts`)

Add any new filter keys. Existing params: `page`, `perPage`, `name`, `gender`, `category`, `role`, `sort`.

### Step 7: Navigation (`src/config/nav-config.ts`)

```tsx
{ title: 'Orders', url: '/dashboard/orders', icon: 'product', items: [] }
```

### Step 8: Icons (`src/components/icons.tsx`)

To register a new icon, import from `@tabler/icons-react` and add to the `Icons` object:

```tsx
import { IconShoppingCart } from '@tabler/icons-react';
export const Icons = { /* ...existing */ cart: IconShoppingCart };
```

Never import `@tabler/icons-react` anywhere else. Always use `Icons.keyName`.

**Existing icon keys** (partial): `dashboard`, `product`, `kanban`, `chat`, `forms`, `user`, `teams`, `billing`, `settings`, `add`, `edit`, `trash`, `search`, `check`, `close`, `clock`, `ellipsis`, `text`, `calendar`, `upload`, `spinner`, `chevronDown/Left/Right/Up`, `sun`, `moon`, `palette`, `pro`, `workspace`, `notification`.

---

## Forms

Forms use **TanStack Form + Zod** with `useAppForm` + `useFormFields<T>()` and `useMutation` for submission. See [references/forms-guide.md](references/forms-guide.md) for all field types, validation strategies, multi-step forms, and advanced patterns.

### Page Form (Create/Edit on a dedicated route)

The full pattern is shown in Steps 1-4 above. The key structure:

1. **Schema** — Zod schema + inferred type in `schemas/<name>.ts`
2. **Form component** — `useAppForm({ defaultValues, validators: { onSubmit: schema }, onSubmit })` + `useFormFields<T>()` for typed fields
3. **Mutations** — `useMutation({ ...createOrderMutation, onSuccess: () => { toast(); router.push() } })`, spread shared mutation options from `api/mutations.ts` and layer on UI callbacks
4. **View page** — client component that checks `id === 'new'` for create vs `useSuspenseQuery(byIdOptions)` for edit

### Sheet Form (Inline create/edit in a side panel)

For features where a separate page is overkill (like Users). The sheet manages open state; the form uses a `form` attribute to connect to the sheet footer's submit button.

```tsx
'use client';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function OrderFormSheet({
  order,
  open,
  onOpenChange
}: {
  order?: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!order;
  const mutation = useMutation({
    ...(isEdit ? updateOrderMutation : createOrderMutation),
    onSuccess: () => {
      onOpenChange(false);
    }
  });
  const form = useAppForm({
    defaultValues: { customer: order?.customer ?? '' /* ... */ } as OrderFormValues,
    validators: { onSubmit: orderSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    }
  });
  const { FormTextField, FormSelectField } = useFormFields<OrderFormValues>();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit' : 'New'} Order</SheetTitle>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='order-sheet-form' className='space-y-4'>
              <FormTextField name='customer' label='Customer' required />
              <FormSelectField name='status' label='Status' required options={STATUS_OPTIONS} />
            </form.Form>
          </form.AppForm>
        </div>
        <SheetFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='order-sheet-form' disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

For cell actions, add `const [editOpen, setEditOpen] = useState(false)` and render `<OrderFormSheet order={data} open={editOpen} onOpenChange={setEditOpen} />` with a `<DropdownMenuItem onClick={() => setEditOpen(true)}>`. For the page header "Add" button, create a trigger component that manages `open` state and renders the sheet.

**Available field components** from `useFormFields<T>()`: `FormTextField`, `FormTextareaField`, `FormSelectField`, `FormCheckboxField`, `FormSwitchField`, `FormRadioGroupField`, `FormSliderField`, `FormFileUploadField`.

---

## Data Fetching with React Query

The pattern is: server prefetch → HydrationBoundary → client useSuspenseQuery.

1. **Server**: `void queryClient.prefetchQuery(options)` — fire-and-forget during SSR streaming
2. **Client**: `useSuspenseQuery(options)` — picks up dehydrated data, suspends until resolved
3. **HydrationBoundary + dehydrate**: bridges server cache → client cache
4. **Suspense fallback**: skeleton shown while data streams

**Why `useSuspenseQuery` not `useQuery`:** `useQuery` doesn't integrate with Suspense — it shows loading even when data is prefetched. `useSuspenseQuery` picks up the dehydrated pending query. Once cached (within `staleTime: 60s`), subsequent visits are instant.

**Mutations** use `mutationOptions` + `getQueryClient()` in `mutations.ts`, composed via spread at the call site:

```tsx
// In mutations.ts — shared config
export const createOrderMutation = mutationOptions({
  mutationFn: (data) => createOrder(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

// In component — spread + layer UI callbacks
const mutation = useMutation({
  ...createOrderMutation,
  onSuccess: () => toast.success('Created')
});
```

See [references/query-abstractions.md](references/query-abstractions.md) for why `mutationOptions`/`queryOptions` are the right abstraction over custom hooks.

---

## Navigation & RBAC

Configure in `src/config/nav-config.ts`. Items are filtered client-side in `src/hooks/use-nav.ts` using Clerk.

**Access control properties** on nav items:

- `requireOrg: boolean` — requires active Clerk organization
- `permission: string` — requires specific Clerk permission
- `role: string` — requires specific Clerk role
- `plan: string` — requires subscription plan (server-side)
- `feature: string` — requires feature flag (server-side)

Items without `access` are visible to everyone. All client-side checks are synchronous — no loading states.

---

## Themes

See [references/theming-guide.md](references/theming-guide.md) for the complete guide. Quick steps:

1. Create `src/styles/themes/<name>.css` with OKLCH color tokens + `@theme inline` block
2. Import in `src/styles/theme.css`
3. Register in `THEMES` array in `src/components/themes/theme.config.ts`
4. (Optional) Add Google Fonts in `src/components/themes/font.config.ts`

---

## Code Conventions

- **`cn()`** for class merging — never concatenate className strings
- **Server components by default** — only add `'use client'` when needed
- **React Query** — `void prefetchQuery()` on server + `useSuspenseQuery` on client
- **API layer** — `types.ts` → `service.ts` → `queries.ts` → `mutations.ts` per feature; `queryOptions`/`mutationOptions` as base abstractions (not custom hooks); `getQueryClient()` in mutations (not `useQueryClient()`); key factories (`entityKeys.all/list/detail`); components never import mock APIs directly
- **nuqs** — `searchParamsCache` on server, `useQueryStates` on client with `shallow: true`
- **Icons** — only from `@/components/icons`, never from `@tabler/icons-react` directly
- **Forms** — `useAppForm` + `useFormFields<T>()` from `@/components/ui/tanstack-form`
- **Page headers** — `PageContainer` props, never import `<Heading>` manually
- **Sort parser** — use `getSortingStateParser` from `@/lib/parsers` (same parser as `useDataTable`)
- **Formatting** — single quotes, JSX single quotes, no trailing comma, 2-space indent
