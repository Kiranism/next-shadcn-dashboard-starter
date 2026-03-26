---
name: kiranism-shadcn-dashboard
description: |
  Guide for building features, pages, tables, forms, themes, and navigation in this Next.js 16 shadcn dashboard template. Use this skill whenever the user wants to add a new page, create a feature module, build a data table, add a form, configure navigation items, add a theme, set up RBAC access control, or work with the dashboard's patterns and conventions. Also triggers when adding routes under /dashboard, working with Clerk auth/orgs/billing, creating mock APIs, or modifying the sidebar. Even if the user doesn't mention "dashboard" explicitly — if they're adding UI, pages, or features to this project, use this skill.
---

# Dashboard Development Guide

This skill encodes the exact patterns and conventions used in this Next.js 16 + shadcn/ui admin dashboard template. Following these patterns ensures consistency across the codebase.

## Quick Reference: What Goes Where

| Task | Location |
|------|----------|
| New page | `src/app/dashboard/<name>/page.tsx` |
| New feature | `src/features/<name>/components/` |
| Query options | `src/features/<name>/api/queries.ts` |
| Nav item | `src/config/nav-config.ts` |
| Types | `src/types/index.ts` |
| Mock data | `src/constants/mock-api.ts` or `mock-api-<name>.ts` |
| Search params | `src/lib/searchparams.ts` |
| Query client | `src/lib/query-client.ts` |
| Theme CSS | `src/styles/themes/<name>.css` |
| Theme registry | `src/components/themes/theme.config.ts` |
| Custom hook | `src/hooks/` |
| Form components | `src/components/forms/` |
| Table components | `src/components/ui/table/` |
| Icons registry | `src/components/icons.tsx` |

---

## Adding a New Feature (End-to-End)

When a user asks to add a new feature (e.g., "add a users page", "create an orders section"), follow all these steps in order:

1. **Create mock API** in `src/constants/mock-api-<name>.ts`
2. **Create query options** in `src/features/<name>/api/queries.ts`
3. **Create the feature module** in `src/features/<name>/components/`
4. **Create the page route** in `src/app/dashboard/<name>/page.tsx`
5. **Add search params** in `src/lib/searchparams.ts` (if table/filtering needed)
6. **Add navigation** in `src/config/nav-config.ts`
7. **Register icon** in `src/components/icons.tsx` (if new icon needed)

---

## 1. Data Fetching with React Query

The project uses **TanStack React Query** for data fetching with server-side prefetching and client-side cache management. This is the default pattern for all new pages.

### Query Options (`api/queries.ts`)

Define reusable query options shared between server prefetch and client hooks:

```tsx
import { queryOptions } from '@tanstack/react-query';
import { fakeEntities, type Entity } from '@/constants/mock-api-entities';

export type { Entity };

export const entitiesQueryOptions = (filters: {
  page?: number;
  limit?: number;
  search?: string;
}) =>
  queryOptions({
    queryKey: ['entities', filters],
    queryFn: () => fakeEntities.getEntities(filters)
  });
```

### Server Prefetch + Client Hydration (Listing Component)

```tsx
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { entitiesQueryOptions } from '../api/queries';
import { EntityTable, EntityTableSkeleton } from './entity-table';
import { Suspense } from 'react';

export default function EntityListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');

  const filters = { page, limit: pageLimit, ...(search && { search }) };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(entitiesQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<EntityTableSkeleton />}>
        <EntityTable />
      </Suspense>
    </HydrationBoundary>
  );
}
```

### Client Table Component (`shallow: true` + `useQuery`)

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useDataTable } from '@/hooks/use-data-table';
import { entitiesQueryOptions } from '../../api/queries';
import { columns } from './columns';

export function EntityTable() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('name');

  const filters = { page, limit: pageSize, ...(search && { search }) };

  const { data, isLoading } = useQuery(entitiesQueryOptions(filters));

  const { table } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: Math.ceil((data?.total_items ?? 0) / pageSize),
    shallow: true,  // URL changes stay client-side — React Query handles fetching
    debounceMs: 500,
    initialState: { columnPinning: { right: ['actions'] } }
  });

  if (isLoading) return <DataTableSkeleton columnCount={5} rowCount={10} filterCount={2} />;

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
```

**Key points:**
- `shallow: true` — URL changes stay client-side, React Query fetches on the client
- `shallow: false` — triggers full RSC server navigation (legacy pattern, avoid for new pages)
- First load uses hydrated server-prefetched data (no loading spinner)
- Subsequent pagination/filter changes fetch on the client
- Cached pages/filters load instantly (React Query cache)

### Mutations (Forms)

```tsx
const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: (data: Payload) => fakeEntities.createEntity(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['entities'] });
    toast.success('Created successfully');
    router.push('/dashboard/entities');
  },
  onError: () => toast.error('Failed to create')
});

// In useAppForm onSubmit:
onSubmit: async ({ value }) => {
  await createMutation.mutateAsync(payload);
}
```

---

## 2. Page Structure

Pages are **server components** by default. They use `PageContainer` and accept search params as a Promise (Next.js 16 pattern).

```tsx
import PageContainer from '@/components/layout/page-container';
import EntityListingPage from '@/features/entities/components/entity-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Dashboard: Entities' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Entities'
      pageDescription='Manage entities (React Query + nuqs table pattern.)'
    >
      <EntityListingPage />
    </PageContainer>
  );
}
```

---

## 3. Data Tables

Tables use TanStack Table v8 with `useDataTable` hook and `nuqs` for URL state.

### Column Definitions

```tsx
export const columns: ColumnDef<YourType>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
    meta: { label: 'Name', placeholder: 'Search...', variant: 'text', icon: Icons.text },
    enableColumnFilter: true
  },
  {
    id: 'category',
    accessorKey: 'category',
    enableColumnFilter: true,
    meta: { label: 'Category', variant: 'multiSelect', options: CATEGORY_OPTIONS }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
```

### Column Pinning

```tsx
initialState: { columnPinning: { right: ['actions'] } }
```

**Filter variants**: `text`, `number`, `range`, `date`, `dateRange`, `select`, `multiSelect`, `boolean`

---

## 4. Forms

See `docs/forms.md` for the complete form system. Forms use **TanStack Form + Zod** with `useAppForm` + `useFormFields<T>()` and `useMutation` for submission.

---

## 5. Navigation, Search Params, Icons, Themes

- **Nav**: `src/config/nav-config.ts` — groups with RBAC `access` property
- **Search params**: `src/lib/searchparams.ts` — add new params with `parseAsString`/`parseAsInteger`
- **Icons**: `src/components/icons.tsx` — single source of truth, never import `@tabler/icons-react` directly
- **Themes**: `src/styles/themes/<name>.css` with OKLCH colors, register in `theme.config.ts`

---

## Code Conventions

- **`cn()` for class merging** — never concatenate className strings
- **Server components by default** — only add `'use client'` when needed
- **React Query for data fetching** — `useQuery` + `shallow: true` for tables, `useMutation` for forms
- **nuqs for URL state** — `searchParamsCache` on server, `useQueryState` on client
- **Formatting**: single quotes, JSX single quotes, no trailing comma, 2-space tabs
