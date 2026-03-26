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
| Custom hook | `src/hooks/` |
| Form components | `src/components/forms/` |
| Table components | `src/components/ui/table/` |
| Icons registry | `src/components/icons.tsx` |
| Icons showcase | `src/app/dashboard/elements/icons/page.tsx` |

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
- **Always use `PageContainer` props for page headers** — never import `<Heading>` manually
- `PageContainer` props: `scrollable`, `pageTitle`, `pageDescription`, `infoContent`, `pageHeaderAction`

### PageContainer with Action Button

```tsx
<PageContainer
  pageTitle='Products'
  pageDescription='Manage your products.'
  pageHeaderAction={
    <Link href='/dashboard/product/new' className={cn(buttonVariants())}>
      <Icons.add className='mr-2 h-4 w-4' /> Add New
    </Link>
  }
>
```

---

## 2. Feature Module Structure

Features live in `src/features/<name>/components/`. Each feature is a self-contained module:

```
src/features/<name>/
└── components/
    ├── <name>-listing.tsx        # Server component: fetches data, passes to table
    ├── <name>-form.tsx           # Client component: create/edit form
    ├── <name>-view-page.tsx      # View/detail page component
    └── <name>-tables/            # Table-specific components
        ├── index.tsx             # Table wrapper with useDataTable
        ├── columns.tsx           # Column definitions
        ├── cell-action.tsx       # Row action dropdown
        └── options.ts            # Filter options constants
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
import { Icons } from '@/components/icons';

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
      icon: Icons.text
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
import { Icons } from '@/components/icons';

interface CellActionProps {
  data: YourType;
}

export function CellAction({ data }: CellActionProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <Icons.ellipsis className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem>
          <Icons.edit className='mr-2 h-4 w-4' /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem className='text-destructive focus:text-destructive'>
          <Icons.trash className='mr-2 h-4 w-4' /> Delete
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

Forms use **TanStack Form + Zod** with the project's custom `useAppForm` hook and field layout components from `src/components/ui/tanstack-form.tsx` and `src/components/ui/field.tsx`.

```tsx
'use client';

import { useAppForm } from '@/components/ui/tanstack-form';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(10, 'Description must be at least 10 characters')
});

export default function FeatureForm() {
  const form = useAppForm({
    defaultValues: {
      name: '',
      category: '',
      description: ''
    },
    validators: {
      onSubmit: formSchema as any
    },
    onSubmit: ({ value }) => {
      console.log('Submitted:', value);
    }
  });

  return (
    <form.AppForm>
      <form.Form className='space-y-6'>
        <form.AppField
          name='name'
          children={(field) => (
            <field.FieldSet>
              <field.Field>
                <field.FieldLabel htmlFor={field.name}>Name *</field.FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Enter name'
                  aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                />
              </field.Field>
              <field.FieldError />
            </field.FieldSet>
          )}
        />

        <form.AppField
          name='category'
          children={(field) => (
            <field.FieldSet>
              <field.Field>
                <field.FieldLabel>Category *</field.FieldLabel>
                <Select value={field.state.value} onValueChange={field.handleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='a'>Option A</SelectItem>
                    <SelectItem value='b'>Option B</SelectItem>
                  </SelectContent>
                </Select>
              </field.Field>
              <field.FieldError />
            </field.FieldSet>
          )}
        />

        <form.SubmitButton label='Submit' />
      </form.Form>
    </form.AppForm>
  );
}
```

**Key form patterns:**
- `useAppForm` — creates form with `defaultValues`, `validators`, `onSubmit`
- `form.AppField` — renders a field with render prop `children={(field) => ...}`
- `field.FieldSet` → `field.Field` → `field.FieldLabel` + input + `field.FieldError` — standard field layout
- `field.Field orientation='horizontal'` — label left, input right (for switches, checkboxes)
- `form.SubmitButton` — auto-disables during submit, shows spinner
- **Never use `useState` inside `children` render prop** — extract into a separate component instead (Rules of Hooks)
- Multi-step forms use `withFieldGroup` and `useFormStepper` from `src/hooks/use-stepper.tsx`
- See `src/components/forms/demo-form.tsx` for all input types and `src/features/forms/components/multi-step-product-form.tsx` for multi-step pattern

---

## 5. Navigation Configuration

Navigation is organized into **groups** in `src/config/nav-config.ts`. Each group has a `label` (rendered as a sidebar section header) and an `items` array:

```tsx
import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        shortcut: ['d', 'd'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Elements',
    items: [
      // Parent with sub-items (collapsible):
      {
        title: 'Forms',
        url: '#',
        icon: 'forms',
        isActive: true,           // Expanded by default
        items: [
          {
            title: 'Basic Form',
            url: '/dashboard/forms/basic',
            icon: 'forms',
            shortcut: ['f', 'f']
          },
          {
            title: 'Multi-Step Form',
            url: '/dashboard/forms/multi-step',
            icon: 'forms'
          }
        ]
      },
      // Flat item (no sub-items):
      {
        title: 'Icons',
        url: '/dashboard/elements/icons',
        icon: 'palette',
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: '',                    // Empty label = no section header
    items: [
      // With RBAC access control:
      {
        title: 'Admin Only',
        url: '/dashboard/admin',
        icon: 'settings',
        access: {
          requireOrg: true,
          permission: 'org:admin:manage',
          role: 'admin'
        },
        items: []
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

## 9. Icon System

**All icons come from `src/components/icons.tsx` — the single source of truth.**

The project uses `@tabler/icons-react` as the sole icon package. Every icon is re-exported through the `Icons` object. **Never import directly from `@tabler/icons-react` or any other icon package.**

### Usage Pattern

```tsx
import { Icons } from '@/components/icons';

// In JSX
<Icons.search className='h-4 w-4' />
<Icons.chevronRight className='h-4 w-4' />

// Passing as a prop or variable
icon={Icons.check}
const TrashIcon = Icons.trash;
```

### Adding a New Icon

1. Import the tabler icon at the top of `src/components/icons.tsx`
2. Add a **semantic** key to the `Icons` object (e.g., `trash` not `iconTrash`)
3. Use `Icons.yourKey` in your component

```tsx
// src/components/icons.tsx
import { IconNewThing } from '@tabler/icons-react';

export const Icons = {
  // ...existing
  newThing: IconNewThing
};
```

### Common Icon Keys

| Key | Use for |
|-----|---------|
| `check`, `close`, `search` | General actions |
| `chevronDown`, `chevronRight`, `chevronsUpDown` | Navigation / dropdowns |
| `add`, `edit`, `trash`, `upload` | CRUD actions |
| `spinner` | Loading states |
| `info`, `warning`, `alertCircle` | Status / feedback |
| `sun`, `moon`, `brightness` | Theme toggles |
| `bold`, `italic`, `underline`, `text` | Text formatting |
| `check`, `circle`, `circleX`, `minus` | Form indicators (checkbox, radio, etc.) |
| `panelLeft`, `gripVertical`, `eyeOff` | UI controls (sidebar, resize, column visibility) |

### Rules

- **NEVER** import from `@tabler/icons-react` outside of `src/components/icons.tsx`
- **NEVER** import from `lucide-react` — the project removed this dependency
- **ALWAYS** use `Icons.keyName` in components
- When writing code examples or templates, use the `Icons` import pattern

### Icon Showcase

All icons are browsable at `/dashboard/elements/icons` with search.

---

## Code Conventions

These conventions come from the existing codebase — follow them for consistency:

- **`cn()` for class merging** — never concatenate className strings manually
- **Server components by default** — only add `'use client'` when using browser APIs or React hooks
- **`@/*` import alias** — all imports from `src/` use this alias
- **Function declarations** for components: `function ComponentName() {}` or `export default function`
- **Props interface naming**: `{ComponentName}Props`
- **Formatting**: single quotes, JSX single quotes, no trailing comma, 2-space tabs
- **Icons**: always import from `@/components/icons` — never directly from `@tabler/icons-react`
- **Don't modify `src/components/ui/`** directly — extend shadcn components instead
