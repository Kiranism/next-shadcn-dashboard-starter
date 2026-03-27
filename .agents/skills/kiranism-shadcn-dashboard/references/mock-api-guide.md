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
export const fakeOrders = {
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
fakeOrders.initialize();
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

The mock API is only imported in `service.ts`. Queries and components import from the service and types files:

```
mock-api-orders.ts  →  api/service.ts  →  api/queries.ts  →  components
(data source)          (data access)       (key factory +     (useSuspenseQuery
                                            queryOptions)       + useMutation)
```

**service.ts** imports from the mock API:

```tsx
import { fakeOrders } from '@/constants/mock-api-orders';
import type { OrderFilters, OrdersResponse } from './types';

export async function getOrders(filters: OrderFilters): Promise<OrdersResponse> {
  return fakeOrders.getOrders(filters);
}
export async function createOrder(data: OrderMutationPayload) {
  return fakeOrders.createOrder(data);
}
```

**queries.ts** imports from service, uses key factories:

```tsx
import { getOrders } from './service';
import type { OrderFilters } from './types';

export const orderKeys = {
  all: ['orders'] as const,
  list: (filters: OrderFilters) => [...orderKeys.all, 'list', filters] as const,
  detail: (id: number) => [...orderKeys.all, 'detail', id] as const
};

export const ordersQueryOptions = (filters: OrderFilters) =>
  queryOptions({ queryKey: orderKeys.list(filters), queryFn: () => getOrders(filters) });
```

**Mutations** in components use service functions + key factories:

```tsx
import { createOrder } from '../api/service';
import { orderKeys } from '../api/queries';

const mutation = useMutation({
  mutationFn: (data) => createOrder(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all })
});
```
