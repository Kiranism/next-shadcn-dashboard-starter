# Mock API Guide

## Table of Contents

1. [Structure](#structure)
2. [Full Template](#full-template)
3. [Key Patterns](#key-patterns)
4. [Integrating with React Query](#integrating-with-react-query)

---

## Structure

Each mock API file lives in `src/constants/mock-api-<name>.ts` and is a self-contained in-memory database. It uses:

- **faker** for generating sample data
- **match-sorter** for fuzzy search across fields
- **delay** (from `./mock-api`) to simulate network latency

The `delay` function is exported from `src/constants/mock-api.ts`:

```tsx
export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

---

## Full Template

```tsx
import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter';
import { delay } from './mock-api';

// 1. Define the entity type
export type Order = {
  id: number;
  customer: string;
  email: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
};

// 2. Create the fake database object
const fakeOrdersStore = {
  records: [] as Order[],

  // 3. Initialize with faker data
  initialize() {
    const statuses = ['pending', 'processing', 'completed', 'cancelled'];
    for (let i = 1; i <= 20; i++) {
      this.records.push({
        id: i,
        customer: faker.person.fullName(),
        email: faker.internet.email(),
        status: faker.helpers.arrayElement(statuses),
        total: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
        created_at: faker.date.between({ from: '2023-01-01', to: Date.now() }).toISOString(),
        updated_at: faker.date.recent().toISOString()
      });
    }
  },

  // 4. Get all with optional search (used internally)
  async getAll({ search }: { search?: string } = {}) {
    let items = [...this.records];
    if (search) {
      items = matchSorter(items, search, {
        keys: ['customer', 'email']
      });
    }
    return items;
  },

  // 5. Paginated list with filtering and sorting
  async getOrders(params: {
    page?: number;
    limit?: number;
    search?: string;
    statuses?: string;
    sort?: string;
  }) {
    await delay(800);
    const { page = 1, limit = 10, search, statuses, sort } = params;

    let items = await this.getAll({ search });

    // Filter by comma-separated values
    if (statuses) {
      const statusList = statuses.split('.');
      items = items.filter((item) => statusList.includes(item.status));
    }

    // Sort by column
    if (sort) {
      const parsedSort = JSON.parse(sort) as { id: string; desc: boolean }[];
      if (parsedSort.length > 0) {
        const { id, desc } = parsedSort[0];
        items.sort((a, b) => {
          const aVal = a[id as keyof Order];
          const bVal = b[id as keyof Order];
          if (aVal < bVal) return desc ? 1 : -1;
          if (aVal > bVal) return desc ? -1 : 1;
          return 0;
        });
      }
    }

    // Paginate
    const total_items = items.length;
    items = items.slice((page - 1) * limit, page * limit);

    return { items, total_items };
  },

  // 6. Get single record by ID
  async getOrderById(id: number) {
    await delay(800);
    return this.records.find((r) => r.id === id) || null;
  },

  // 7. Create
  async createOrder(data: Omit<Order, 'id' | 'created_at' | 'updated_at'>) {
    await delay(800);
    const newRecord: Order = {
      ...data,
      id: this.records.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.records.push(newRecord);
    return newRecord;
  },

  // 8. Update
  async updateOrder(id: number, data: Partial<Order>) {
    await delay(800);
    const idx = this.records.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.records[idx] = {
      ...this.records[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    return this.records[idx];
  },

  // 9. Delete
  async deleteOrder(id: number) {
    await delay(800);
    this.records = this.records.filter((r) => r.id !== id);
    return true;
  }
};

// 10. Auto-initialize on import
// Route handlers and pages are separate server bundles, each with its own copy of
// this module. One store per server process on globalThis keeps them in sync.
const globalForMock = globalThis as typeof globalThis & { fakeOrders?: typeof fakeOrdersStore };
if (!globalForMock.fakeOrders) {
  fakeOrdersStore.initialize();
  globalForMock.fakeOrders = fakeOrdersStore;
}

export const fakeOrders = globalForMock.fakeOrders;
```

---

## Key Patterns

### Search with match-sorter

Always specify which fields to search across:

```tsx
matchSorter(items, search, { keys: ['customer', 'email', 'status'] });
```

### Comma-separated filter values

For multi-select filters (roles, statuses), the URL param uses `.` as delimiter:

```tsx
if (statuses) {
  const list = statuses.split('.');
  items = items.filter((item) => list.includes(item.status));
}
```

### Computed column sorting

When a table has a computed column (e.g., combining first_name + last_name into "name"), handle it in the sort logic:

```tsx
if (id === 'name') {
  const aName = `${a.first_name} ${a.last_name}`;
  const bName = `${b.first_name} ${b.last_name}`;
  return desc ? bName.localeCompare(aName) : aName.localeCompare(bName);
}
```

### Return shape

List methods must return `{ items, total_items }` (or `{ products, total }` etc. — match the query option expectations). The total is the count **before** pagination, used for `pageCount` calculation.

---

## Integrating with the API Layer

The mock API is only imported in the server-only `data.ts`. The browser reaches it through route handlers; server prefetches call `data.ts` directly (the layout of TanStack's [Next.js optimistic updates example](https://github.com/TanStack/query/tree/main/examples/react/nextjs-app-optimistic-updates)):

```
browser:  components → api/queries.ts → api/service.ts → fetch('/api/orders') → app/api/orders/route.ts → api/data.ts → mock-api-orders.ts
server:   <name>-listing.tsx prefetch (same query key, queryFn from data.ts)                         → api/data.ts → mock-api-orders.ts
```

**data.ts** is server-only and imports from the mock API. It's the one file to change when connecting a real backend:

```tsx
import 'server-only';
import { fakeOrders } from '@/constants/mock-api-orders';
import type { OrderFilters, OrderMutationPayload, OrdersResponse } from './types';

export async function getOrders(filters: OrderFilters): Promise<OrdersResponse> {
  return fakeOrders.getOrders(filters);
}
export async function createOrder(data: OrderMutationPayload) {
  return fakeOrders.createOrder(data);
}
```

**Route handlers** (`src/app/api/orders/route.ts`) check auth and call `data.ts`:

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createOrder, getOrders } from '@/features/orders/api/data';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  return NextResponse.json(
    await getOrders({
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
      search: searchParams.get('search') ?? undefined,
      sort: searchParams.get('sort') ?? undefined
    })
  );
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json(await createOrder(await request.json()), { status: 201 });
}
```

**service.ts** is the browser side: it calls the route handlers with `apiClient`:

```tsx
import { apiClient, toSearchParams } from '@/lib/api-client';
import type { OrderFilters, OrderMutationPayload, OrdersResponse } from './types';

export async function getOrders(filters: OrderFilters): Promise<OrdersResponse> {
  return apiClient<OrdersResponse>(`/orders?${toSearchParams(filters)}`);
}
export async function createOrder(data: OrderMutationPayload) {
  return apiClient('/orders', { method: 'POST', body: JSON.stringify(data) });
}
```

**queries.ts** imports from service and exports one object for reads and one for writes:

```tsx
import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { createOrder, getOrders } from './service';
import type { OrderFilters, OrderMutationPayload } from './types';

export const orderQueries = {
  all: () => ['orders'] as const,
  list: (filters: OrderFilters) =>
    queryOptions({
      queryKey: [...orderQueries.all(), 'list', filters] as const,
      queryFn: () => getOrders(filters)
    })
};

export const orderMutations = {
  create: () => mutationOptions({ mutationFn: (data: OrderMutationPayload) => createOrder(data) })
};
```

**Mutations** in components spread the options and own invalidation:

```tsx
import { orderMutations, orderQueries } from '../api/queries';

const queryClient = useQueryClient();
const mutation = useMutation({
  ...orderMutations.create(),
  onSuccess: () => toast.success('Order created'),
  onSettled: () => queryClient.invalidateQueries({ queryKey: orderQueries.all() })
});
```
