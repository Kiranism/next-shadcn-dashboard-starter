---
name: dashboard-dev
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
| Nav item | `src/config/nav-config.ts` |
| Types | `src/types/index.ts` |
| Mock data | `src/constants/mock-api.ts` |
| Search params | `src/lib/searchparams.ts` |
| Theme CSS | `src/styles/themes/<name>.css` |
| Theme registry | `src/components/themes/theme.config.ts` |
| Chat feature | `src/features/chat/components/` |
| Notifications | `src/features/notifications/components/` |
| Kanban UI component | `src/components/ui/kanban.tsx` |
| Custom hook | `src/hooks/` |
| Form components | `src/components/forms/` |
| Table components | `src/components/ui/table/` |

---

## Adding a New Feature (End-to-End)

When a user asks to add a new feature (e.g., "add a users page", "create an orders section"), follow all these steps in order. Each step has its own section below with exact patterns.

1. **Create the feature module** in `src/features/<name>/components/`
2. **Create the page route** in `src/app/dashboard/<name>/page.tsx`
3. **Add navigation** in `src/config/nav-config.ts`
4. **Add search params** in `src/lib/searchparams.ts` (if table/filtering needed)
5. **Add mock data** in `src/constants/mock-api.ts` (if demo data needed)
6. **Register icon** in `src/components/icons.tsx` (if new icon needed)

---

## 1. Page Structure

Pages are **server components** by default. They use `PageContainer` and accept search params as a Promise (Next.js 16 pattern).

```tsx
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import { searchParamsCache, type SearchParams } from '@/lib/searchparams';

export const metadata = {
  title: 'Dashboard: Feature Name'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Feature Name'
      pageDescription='Description of what this page shows.'
    >
      <Suspense fallback={<LoadingSkeleton />}>
        <FeatureListingPage />
      </Suspense>
    </PageContainer>
  );
}
```

**Key points:**
- `searchParams` is a `Promise` — always `await` it
- Use `searchParamsCache.parse()` before rendering content that uses search params
- Wrap async data-fetching components in `<Suspense>`
- Use `DataTableSkeleton` as fallback for table pages
- Export `metadata` for the page title
- `PageContainer` props: `scrollable`, `pageTitle`, `pageDescription`, `infoContent`, `pageHeaderAction`

### PageContainer with Action Button

```tsx
<PageContainer
  pageTitle='Products'
  pageDescription='Manage your products.'
  pageHeaderAction={
    <Link href='/dashboard/product/new' className={cn(buttonVariants())}>
      <IconPlus className='mr-2 h-4 w-4' /> Add New
    </Link>
  }
>
```

---

## 2. Feature Module Structure

Features live in `src/features/<name>/components/`. Each feature is a self-contained module:

```
src/features/<name>/
├── components/
│   ├── <name>-listing.tsx        # Server component: fetches data, passes to table
│   ├── <name>-form.tsx           # Client component: create/edit form
│   ├── <name>-view-page.tsx      # View/detail page component
│   └── <name>-tables/            # Table-specific components
│       ├── index.tsx             # Table wrapper with useDataTable
│       ├── columns.tsx           # Column definitions
│       ├── cell-action.tsx       # Row action dropdown
│       └── options.ts            # Filter options constants
└── utils/
    ├── store.ts                  # Zustand store (kanban, chat, notifications)
    ├── types.ts                  # Feature-specific types
    └── data.ts                   # Mock/seed data
```

### Listing Component (Server Component)

```tsx
import { searchParamsCache } from '@/lib/searchparams';
import { FeatureTable } from './feature-tables';
import { fakeFeatures } from '@/constants/mock-api';

export default async function FeatureListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const categories = searchParamsCache.get('category');

  const data = await fakeFeatures.getAll({
    page,
    limit: pageLimit,
    categories,
    search
  });

  const totalItems = data.total_items;
  const items = data.items;

  return (
    <FeatureTable data={items} totalItems={totalItems} />
  );
}
```

---

## 3. Data Tables

Tables use TanStack Table v8 with the project's `useDataTable` hook and `nuqs` for URL state.

### Column Definitions (`columns.tsx`)

```tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action';
import { CATEGORY_OPTIONS } from './options';
import { Text } from 'lucide-react';

export const columns: ColumnDef<YourType>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<string>()}</div>,
    meta: {
      label: 'Name',
      placeholder: 'Search...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    id: 'category',
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ cell }) => (
      <Badge variant='outline' className='capitalize'>
        {cell.getValue<string>()}
      </Badge>
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Category',
      variant: 'multiSelect',
      options: CATEGORY_OPTIONS
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
```

**Filter variants** (set in `meta.variant`):
- `text` — text search with operators (contains, is, etc.)
- `number` — numeric filters
- `range` — slider range
- `date` / `dateRange` — date pickers
- `select` / `multiSelect` — dropdown filters
- `boolean` — yes/no

### Table Wrapper (`index.tsx`)

```tsx
'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { columns } from './columns';

interface FeatureTableProps {
  data: YourType[];
  totalItems: number;
}

export function FeatureTable({ data, totalItems }: FeatureTableProps) {
  const pageCount = Math.ceil(totalItems / 10);

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
```

### Cell Actions (`cell-action.tsx`)

```tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react';

interface CellActionProps {
  data: YourType;
}

export function CellAction({ data }: CellActionProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <IconDotsVertical className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem>
          <IconEdit className='mr-2 h-4 w-4' /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem className='text-destructive focus:text-destructive'>
          <IconTrash className='mr-2 h-4 w-4' /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Filter Options (`options.ts`)

```tsx
export const CATEGORY_OPTIONS = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'home', label: 'Home & Garden' }
];
```

---

## 4. Forms

Forms use React Hook Form + Zod. The project has reusable form field components in `src/components/forms/`.

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z.coerce.number().positive('Price must be positive'),
  description: z.string().min(10, 'Description must be at least 10 characters')
});

type FormValues = z.infer<typeof formSchema>;

interface FeatureFormProps {
  initialData?: FormValues | null;
  pageTitle: string;
}

export default function FeatureForm({ initialData, pageTitle }: FeatureFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      category: '',
      price: undefined,
      description: ''
    }
  });

  function onSubmit(values: FormValues) {
    // Handle submit
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <FormInput
              control={form.control}
              name='name'
              label='Name'
              placeholder='Enter name'
              required
            />
            <FormSelect
              control={form.control}
              name='category'
              label='Category'
              placeholder='Select category'
              required
              options={[
                { label: 'Option A', value: 'a' },
                { label: 'Option B', value: 'b' }
              ]}
            />
            <FormTextarea
              control={form.control}
              name='description'
              label='Description'
              placeholder='Enter description'
              required
              config={{ maxLength: 500, showCharCount: true, rows: 4 }}
            />
            <Button type='submit'>
              {initialData ? 'Update' : 'Create'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

**Available form components** (all accept `control`, `name`, `label`, `description`, `required`, `disabled`):
- `FormInput` — text, email, number, password inputs
- `FormSelect` — dropdown select with `options` prop
- `FormTextarea` — textarea with optional `config` (maxLength, showCharCount, rows, resize)
- `FormFileUpload` — file upload with `config` (maxSize, maxFiles)

---

## 5. Navigation Configuration

Add items to `src/config/nav-config.ts`:

```tsx
export const navItems: NavItem[] = [
  {
    title: 'Feature Name',
    url: '/dashboard/feature',
    icon: 'iconName',           // Key from Icons registry
    shortcut: ['f', 'f'],       // Optional: kbar shortcut
    items: []                   // Empty array = no sub-items
  },
  // With RBAC access control:
  {
    title: 'Admin Only',
    url: '/dashboard/admin',
    icon: 'settings',
    access: {
      requireOrg: true,                    // Needs active organization
      permission: 'org:admin:manage',      // Needs specific permission
      role: 'admin'                        // Needs specific role
    },
    items: []
  },
  // With nested sub-items:
  {
    title: 'Parent',
    url: '#',
    icon: 'folder',
    isActive: true,             // Expanded by default
    items: [
      {
        title: 'Child Page',
        url: '/dashboard/parent/child',
        icon: 'file',
        shortcut: ['p', 'c']
      }
    ]
  }
];
```

**Access control options** (all client-side via Clerk hooks):
- `requireOrg: boolean` — requires active organization
- `permission: string` — requires Clerk permission (e.g., `'org:teams:manage'`)
- `role: string` — requires Clerk role (e.g., `'admin'`)
- `plan: string` — requires subscription plan (server-side check at page level)
- `feature: string` — requires feature flag (server-side check at page level)

**Icons**: Check `src/components/icons.tsx` for available icon keys. If you need a new icon, add it to the `Icons` object using a Tabler icon import.

---

## 6. Search Params (for tables with filtering)

Add params in `src/lib/searchparams.ts`:

```tsx
import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  name: parseAsString,
  category: parseAsString
  // Add new params here
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
export type SearchParams = Record<string, string | string[] | undefined>;
```

---

## 7. Mock API Data

Add to `src/constants/mock-api.ts` following the existing pattern:

```tsx
import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter';

export type YourEntity = {
  id: number;
  name: string;
  // ... fields
};

export const fakeEntities = {
  records: [] as YourEntity[],

  initialize() {
    this.records = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: faker.commerce.productName()
      // ... generate fields with faker
    }));
  },

  async getAll({
    page = 1,
    limit = 10,
    search,
    categories
  }: {
    page?: number;
    limit?: number;
    search?: string;
    categories?: string;
  }) {
    let items = [...this.records];

    if (search) {
      items = matchSorter(items, search, { keys: ['name'] });
    }
    if (categories) {
      items = items.filter((item) =>
        categories.split('.').includes(item.category)
      );
    }

    const totalItems = items.length;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      success: true,
      total_items: totalItems,
      items: paginatedItems
    };
  }
};

fakeEntities.initialize();
```

---

## 8. Adding a Theme

See `references/theming-guide.md` for the complete theme creation process. Quick summary:

1. Create `src/styles/themes/<name>.css` with `[data-theme='<name>']` selector
2. Import in `src/styles/theme.css`
3. Add to `THEMES` array in `src/components/themes/theme.config.ts`
4. (Optional) Add fonts in `src/components/themes/font.config.ts`
5. (Optional) Set as default in `theme.config.ts` via `DEFAULT_THEME`

All colors use **OKLCH format**: `oklch(lightness chroma hue)`.

---

## Code Conventions

These conventions come from the existing codebase — follow them for consistency:

- **`cn()` for class merging** — never concatenate className strings manually
- **Server components by default** — only add `'use client'` when using browser APIs or React hooks
- **`@/*` import alias** — all imports from `src/` use this alias
- **Function declarations** for components: `function ComponentName() {}` or `export default function`
- **Props interface naming**: `{ComponentName}Props`
- **Formatting**: single quotes, JSX single quotes, no trailing comma, 2-space tabs
- **Icons**: use `@tabler/icons-react` (project convention), registered in `src/components/icons.tsx`
- **Don't modify `src/components/ui/`** directly — extend shadcn components instead
- **Zustand stores**: features with client state (kanban, chat, notifications) use Zustand in `features/<name>/utils/store.ts`
- **Cleanup**: optional features can be removed via `node scripts/cleanup.js --interactive`
