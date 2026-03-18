# Supabase Integration Standard

This document outlines the standard architecture for linking UI components with Supabase. Always follow this 3-tier pattern to ensure type safety, consistency, and maintainability.

---

## 🏗️ The 3-Tier Architecture

### Tier 1: The Service Layer (Data Fetcher)
The **Service** is where all Supabase-specific logic (queries, filters, joins) resides. It should be located in `src/features/[feature-name]/api/`.

- **Rules:**
  - Use the `createService` factory for standard CRUD.
  - Export `Row`, `Insert`, and `Update` types for the table.
  - Implement specialized queries here (e.g., complex joins).

**Example (`src/features/drivers/api/drivers.service.ts`):**
```typescript
import { createService, type Row } from '@/lib/supabase/service-factory';

export type Driver = Row<'accounts'>; // or specifically 'driver_profiles'
const baseService = createService('accounts');

export const driversService = {
  ...baseService,
  async getActiveDrivers() {
    const { data } = await supabase.from('accounts').select('*').eq('role', 'driver').eq('is_active', true);
    return data;
  }
};
```

---

### Tier 2: The Hook Layer (UI Bridge)
The **Hook** manages the lifecycle of the data (loading, errors, state) and connects the Service to the UI. It should be located in `src/features/[feature-name]/hooks/`.

- **Rules:**
  - One hook per primary data requirement (e.g., `useDrivers`, `useActiveTrips`).
  - Return `isLoading`, `error`, and `data`.
  - Handle toast notifications for errors here.

**Example (`src/features/drivers/hooks/use-drivers.ts`):**
```typescript
export function useDrivers() {
  const [data, setData] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driversService.getAll().then(setData).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

---

### Tier 3: The View Layer (Components)
The **Component** only cares about consuming data and showing it to the user.

- **Rules:**
  - **NEVER** call `supabase.from()` or `fetch()` directly in a component.
  - Always use the custom hook.

**Example:**
```tsx
const { data: drivers, loading } = useDrivers();
if (loading) return <Skeleton />;
return <ul>{drivers.map(d => <li key={d.id}>{d.name}</li>)}</ul>;
```

---

## 🛠️ Maintenance & Updates

### Regenerating Types
If you change your database schema (add columns, new tables) in the Supabase Dashboard, you **must** update the types:
```bash
npx supabase gen types typescript --project-id etwluibddvljuhkxjkxs > src/types/database.types.ts
```

### Adding a New Collection
1. **Types:** Check `database.types.ts` for the table name.
2. **Service:** Create `api/[name].service.ts` using the factory.
3. **Hook:** Create `hooks/use-[name].ts` to wrap the service.
4. **UI:** Replace mock data with your new hook.
