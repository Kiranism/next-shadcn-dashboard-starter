# Panel Layout System

A reusable Miller Columns / progressive-disclosure layout system built on top of the existing UI primitives. Provides type-safe URL-driven navigation, generic list columns, and composable panel shells. Every entity management page in the dashboard can use this system.

---

## What Is Miller Columns?

Miller Columns (also called "cascading lists") is a UI pattern where selecting an item in one column reveals a detail panel in the next column. You see it in macOS Finder, Apple Mail, Linear, and Notion. It works especially well for hierarchical data where you want to keep context visible while drilling into details.

```
┌──────────────┬──────────────────────────┬──────────────────────────┐
│  List        │  Detail                  │  Sub-detail              │
│              │                          │                          │
│  > Item A ●  │  Item A details          │  Sub-item form           │
│    Item B    │  [edit fields]           │  [edit fields]           │
│    Item C    │  ─────────────────       │                          │
│              │  Related items           │  [Abbrechen] [Speichern] │
│  [+ Neu]     │  [+ Add related] ──────► │                          │
└──────────────┴──────────────────────────┴──────────────────────────┘
```

---

## File Structure

```
src/
├── components/panels/          ← Generic UI primitives
│   ├── index.ts                ← Barrel export (import everything from here)
│   ├── column-layout.tsx       ← Outer flex container (border + rounded)
│   ├── panel.tsx               ← Individual column shell (border-r, flex-col)
│   ├── panel-header.tsx        ← Title + description + close button + actions slot
│   ├── panel-body.tsx          ← Scrollable flex-1 area (min-h-0 pattern)
│   ├── panel-footer.tsx        ← Sticky bottom footer (border-t, mt-auto)
│   └── panel-list.tsx          ← Generic searchable list column (PanelList<T>)
│
├── hooks/
│   └── use-column-navigation.ts ← URL state hook (nuqs-based, batch updates)
│
└── features/clients/components/ ← Reference implementation (Fahrgäste)
    ├── clients-view-toggle.tsx   ← Table ↔ Column view toggle (page header)
    ├── clients-column-view.tsx   ← Orchestrator (owns all nav state)
    ├── client-list-panel.tsx     ← Column 1: client list with search
    ├── client-detail-panel.tsx   ← Column 2: client form + rules list
    ├── recurring-rule-form-body.tsx ← Shared rule form fields
    └── recurring-rule-panel.tsx  ← Column 3: rule create/edit form
```

---

## Core Components API

### `ColumnLayout`

The outermost container. Renders `h-full w-full overflow-hidden rounded-lg border`.
All `Panel` components are direct children.

```tsx
import { ColumnLayout } from '@/components/panels';

<ColumnLayout>
  {/* Panel children go here */}
</ColumnLayout>
```

---

### `Panel`

A single column. Full-height flex column with a `border-r` (removed on the last child automatically via `last:border-r-0`).

Control width via `className`:
- Fixed width: `className="w-[280px] shrink-0"`
- Fill remaining space: `className="flex-1 min-w-0"`

```tsx
import { Panel } from '@/components/panels';

<Panel className="w-[460px] shrink-0">
  {/* PanelHeader, PanelBody, PanelFooter */}
</Panel>
```

---

### `PanelHeader`

Structured panel header. Always renders a `border-b`.

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Required. Primary heading. |
| `description` | `string?` | Optional subtitle in muted text. |
| `onClose` | `() => void` | Optional. Renders an X button when provided. |
| `actions` | `ReactNode` | Optional. Rendered between text and close button. |

```tsx
import { PanelHeader } from '@/components/panels';

<PanelHeader
  title="Fahrgast bearbeiten"
  description="Stammdaten und Regelfahrten verwalten."
  onClose={() => nav.clearAll()}
/>
```

---

### `PanelBody`

The scrollable content area. Uses the `min-h-0 flex-1 overflow-y-auto` pattern which is required for scroll to work inside a flex column.

| Prop | Type | Description |
|---|---|---|
| `padded` | `boolean` | Default `true`. Adds `px-4 py-4`. Set `false` for edge-to-edge content. |

```tsx
import { PanelBody } from '@/components/panels';

// With padding (forms, cards)
<PanelBody>
  <MyForm />
</PanelBody>

// Without padding (full-width list rows)
<PanelBody padded={false}>
  {items.map(item => <ListRow key={item.id} ... />)}
</PanelBody>
```

---

### `PanelFooter`

Sticky bottom footer. Renders children in a right-aligned flex row with `border-t`.

```tsx
import { PanelFooter } from '@/components/panels';

<PanelFooter>
  <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
  <Button type="submit">Speichern</Button>
</PanelFooter>
```

---

### `PanelList<T>`

The generic "first column" list panel. Handles search input, loading state, empty state, item selection, and a create button. Accepts a `renderItem` render prop so it works for any entity type.

**Constraint:** `T` must have an `id: string` field.

| Prop | Type | Description |
|---|---|---|
| `items` | `T[]` | Data to render. Filtering done server-side by parent. |
| `loading` | `boolean?` | Shows spinner when true. |
| `selectedId` | `string \| null?` | Highlights the matching row. |
| `onSelect` | `(item: T) => void` | Called on row click. |
| `renderItem` | `(item: T, isSelected: boolean) => ReactNode` | Render prop for each row. |
| `searchValue` | `string` | Controlled search input value. |
| `onSearchChange` | `(val: string) => void` | Called on every keystroke. |
| `searchPlaceholder` | `string?` | Input placeholder. |
| `emptyMessage` | `string?` | Shown when items are empty. |
| `onNew` | `() => void?` | If provided, adds a "+ New" footer button. |
| `newLabel` | `string?` | Label for the new button. |
| `width` | `string?` | Tailwind class, default `"w-[280px]"`. |

```tsx
import { PanelList } from '@/components/panels';

<PanelList<Client>
  items={clients}
  loading={isLoading}
  selectedId={nav.values.clientId}
  onSelect={(client) => nav.set({ clientId: client.id, ruleId: null })}
  renderItem={(client, isSelected) => (
    <ClientListItem client={client} isSelected={isSelected} />
  )}
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Fahrgast suchen..."
  onNew={() => nav.set({ clientId: 'new', ruleId: null })}
  newLabel="Neuer Fahrgast"
/>
```

---

## `useColumnNavigation` Hook

Manages all URL params for a column view as a single atomic state object. Uses nuqs `useQueryStates` so all param changes happen in one browser history entry.

```typescript
import { useColumnNavigation } from '@/hooks/use-column-navigation';

const nav = useColumnNavigation(['clientId', 'ruleId'] as const);

// Read current values
nav.values.clientId   // string | null
nav.values.ruleId     // string | null

// Set one or more params atomically (single history push)
nav.set({ clientId: 'abc-123', ruleId: null });

// Clear specific params
nav.clear('ruleId');
nav.clear('clientId', 'ruleId');

// Clear all managed params
nav.clearAll();
```

**Always use `as const`** on the keys array so TypeScript infers literal types instead of `string[]`.

Options:
```typescript
useColumnNavigation(['clientId', 'ruleId'] as const, {
  historyMode: 'replace' // default: 'push' — use 'replace' for transient state
});
```

---

## How to Add a New Column View Page

Follow these steps to add the Miller Columns view to any entity management page. The Fahrgäste implementation is your reference.

### Step 1 — Add the view toggle to the page

```tsx
// src/app/dashboard/your-page/page.tsx
import { YourViewToggle } from '@/features/your-feature/components/your-view-toggle';

// In pageHeaderAction:
<div className="flex items-center gap-2">
  {!isColumnView && <Link href="...">+ Neu</Link>}
  <YourViewToggle />
</div>
```

Create `your-view-toggle.tsx` by copying `clients-view-toggle.tsx` — only the component name changes.

### Step 2 — Create the orchestrator

```tsx
// src/features/your-feature/components/your-column-view.tsx
'use client';

import { ColumnLayout } from '@/components/panels';
import { useColumnNavigation } from '@/hooks/use-column-navigation';
import { YourListPanel } from './your-list-panel';
import { YourDetailPanel } from './your-detail-panel';

// Choose param names that are unique to this page
const COLUMN_KEYS = ['driverId', 'vehicleId'] as const;

export function YourColumnView() {
  const nav = useColumnNavigation(COLUMN_KEYS);
  const { driverId, vehicleId } = nav.values;

  return (
    <ColumnLayout>
      <YourListPanel
        selectedId={driverId}
        onSelect={(id) => nav.set({ driverId: id, vehicleId: null })}
        onNew={() => nav.set({ driverId: 'new', vehicleId: null })}
      />

      {driverId && (
        <YourDetailPanel
          entityId={driverId}
          onClose={() => nav.clearAll()}
          onSelectSub={(id) => nav.set({ vehicleId: id })}
        />
      )}

      {driverId && driverId !== 'new' && vehicleId && (
        <YourSubPanel
          parentId={driverId}
          subId={vehicleId}
          onClose={() => nav.clear('vehicleId')}
          onSuccess={() => nav.clear('vehicleId')}
        />
      )}
    </ColumnLayout>
  );
}
```

### Step 3 — Build the list panel

```tsx
// src/features/your-feature/components/your-list-panel.tsx
'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { PanelList } from '@/components/panels';
import { yourService, YourEntity } from '../api/your.service';

interface YourListPanelProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function YourListPanel({ selectedId, onSelect, onNew }: YourListPanelProps) {
  const [items, setItems] = useState<YourEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  useEffect(() => {
    setLoading(true);
    yourService.getAll({ search: debouncedSearch || undefined })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  return (
    <PanelList<YourEntity>
      items={items}
      loading={loading}
      selectedId={selectedId}
      onSelect={(item) => onSelect(item.id)}
      renderItem={(item, isSelected) => (
        <YourListItem item={item} isSelected={isSelected} />
      )}
      searchValue={search}
      onSearchChange={setSearch}
      onNew={onNew}
      newLabel="Neuer Eintrag"
    />
  );
}
```

### Step 4 — Build the detail panel

```tsx
// src/features/your-feature/components/your-detail-panel.tsx
'use client';

import { Panel, PanelHeader, PanelBody } from '@/components/panels';
// ... fetch entity, render form

export function YourDetailPanel({ entityId, onClose, onSelectSub }) {
  return (
    <Panel className="w-[460px] shrink-0">
      <PanelHeader
        title={entityName}
        description="Details bearbeiten"
        onClose={onClose}
      />
      <PanelBody>
        {/* Your form or content here */}
      </PanelBody>
    </Panel>
  );
}
```

### Step 5 — (Optional) Build the sub-panel

Same pattern as the detail panel. For forms, extract the form fields into a
`YourFormBody` component shared between a `Sheet` (existing overlay) and the
`Panel` column. See `recurring-rule-form-body.tsx` as the reference.

---

## Design Decisions & Rationale

### Why URL params instead of component state?

URL params give you deep linking, browser back/forward, and page refresh for free.
If a user shares a URL with `?clientId=abc&ruleId=xyz`, it opens exactly that
column state. Component state would lose all context on refresh.

### Why `useQueryStates` (batched) instead of multiple `useQueryState` calls?

When selecting a client, you also need to clear the rule (it belongs to the old client).
With individual `useQueryState` hooks, this creates two separate URL changes and two
history entries — pressing back would take you through an intermediate broken state.
`useQueryStates` batches all changes into one atomic URL push.

### Why render props for `PanelList`?

Different entity types need different row layouts (name + city for clients,
name + plate for vehicles, etc.). A render prop keeps `PanelList` generic while
letting each feature own its visual row design. The alternative — passing a
dozen individual props for avatar/title/subtitle/badge — scales poorly.

### Why extract `RecurringRuleFormBody`?

The recurring rule form is visually identical in both the Sheet overlay
(`/dashboard/clients/[id]`) and the Panel column (`?view=columns`). Extracting the
fields into a shared component means fixes and improvements to the form automatically
apply in both contexts. The Sheet and Panel components each own their own `useForm`
state and submit logic — `RecurringRuleFormBody` is purely presentational.

### Why does `Panel` use `border-r last:border-r-0` instead of gaps?

A gap between panels would show the page background color between columns,
breaking the "single card" illusion. Border-r on each panel except the last
gives a clean internal divider with no visual leakage.

---

## Common Pitfalls

**Panel scroll not working:**
Ensure `PanelBody` is a direct child of `Panel` (which has `flex flex-col h-full`).
The `min-h-0` on `PanelBody` is essential — without it, flex children don't
constrain to their parent's height and `overflow-y-auto` has nothing to overflow against.

**`useColumnNavigation` infers `string` instead of literal union:**
Always pass the keys array `as const`. Without it, TypeScript infers `string[]`
and you lose type safety on `nav.values.clientId` (it becomes `string | null`
instead of a properly typed property).

**Columns overflowing horizontally:**
The outer `ColumnLayout` needs to be inside a container that has a fixed or
`calc()` width. `PageContainer` with `scrollable={false}` provides this via
`flex flex-1 flex-col` — the column layout fills the available space.

**Creating a new entity and the list doesn't update:**
After a successful create, call `window.__refreshClientList()` (or the equivalent
function registered by your list panel) to trigger a re-fetch. Alternatively,
use a Zustand store to decouple this refresh signal for larger applications.
