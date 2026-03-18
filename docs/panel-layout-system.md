# Panel Layout System

A reusable Miller Columns / progressive-disclosure layout system built on top of the existing UI primitives. Provides type-safe URL-driven navigation, generic list columns, composable panel shells, and user-resizable column widths. Every entity management page in the dashboard can use this system.

---

## What Is Miller Columns?

Miller Columns (also called "cascading lists") is a UI pattern where selecting an item in one column reveals a detail panel in the next column. You see it in macOS Finder, Apple Mail, Linear, and Notion. It works especially well for hierarchical data where you want to keep context visible while drilling into details.

```
┌──────────────┬──────────────────────────┬──────────────────────────┐
│  List        │  Detail                  │  Sub-detail              │
│              │  [Aktualisieren] [X]     │                          │
│  > Item A ●  │  Item A details          │  Sub-item form           │
│    Item B    │  [edit fields]           │  [edit fields]           │
│    Item C    │  ─────────────────       │                          │
│              │  Related items           │  [Abbrechen] [Speichern] │
│  [+ Neu]     │  [+ Add related] ──────► │  ← fixed footer          │
└──────────────┴──────────────────────────┴──────────────────────────┘
      ↕ drag to resize       ↕ drag to resize
```

---

## File Structure

```
src/
├── components/panels/           ← Generic UI primitives
│   ├── index.ts                 ← Barrel export (import everything from here)
│   ├── column-layout.tsx        ← Outer container (border + rounded, no fixed size)
│   ├── panel.tsx                ← Individual column shell (border-r, flex-col)
│   ├── panel-header.tsx         ← Title + description + close button + actions slot
│   ├── panel-body.tsx           ← Scrollable flex-1 area (min-h-0 pattern)
│   ├── panel-footer.tsx         ← Fixed bottom footer (shrink-0, border-t)
│   └── panel-list.tsx           ← Generic searchable list column (PanelList<T>)
│
├── hooks/
│   └── use-column-navigation.ts  ← URL state hook (nuqs-based, batch updates)
│
└── features/clients/components/  ← Reference implementation (Fahrgäste)
    ├── clients-view-toggle.tsx    ← Table ↔ Column view toggle (page header)
    ├── clients-column-view.tsx    ← Orchestrator: ResizablePanelGroup + nav state
    ├── client-list-panel.tsx      ← Column 1: client list with search
    ├── client-detail-panel.tsx    ← Column 2: client form + header save button
    ├── recurring-rule-form-body.tsx ← Shared rule form fields (FormProvider only)
    └── recurring-rule-panel.tsx   ← Column 3: rule form + PanelFooter
```

---

## Height Chain — Why Everything Must Be `flex-1 min-h-0`

For each `PanelBody` to scroll independently (instead of the whole page scrolling),
the layout must be **height-anchored** from root to leaf. The full chain:

```
SidebarProvider  →  min-h-svh (minimum, can grow — this is why we anchor below)
  SidebarInset   →  flex-1 flex-col overflow-hidden
    Header       →  shrink-0 (52px)
    PageContainer scrollable=false  →  h-[calc(100dvh-52px)] overflow-hidden  ← ANCHOR
      page header row  →  shrink-0
      YourColumnView   →  flex-1 min-h-0 overflow-hidden   ← fills remaining height
        div wrapper    →  flex-1 min-h-0 overflow-hidden rounded-lg border
          ResizablePanelGroup  →  h-full w-full
            ResizablePanel     →  controlled by group
              Panel            →  h-full flex-col
                PanelHeader    →  shrink-0
                PanelBody      →  flex-1 min-h-0 overflow-y-auto  ← scrolls here
                PanelFooter    →  shrink-0  ← always visible
```

**Key rules:**
1. `PageContainer` with `scrollable={false}` sets `h-[calc(100dvh-52px)] overflow-hidden` — the height anchor.
2. Every wrapper in the chain uses `flex-1 min-h-0`. Without `min-h-0`, flex children ignore their parent's height cap.
3. Only `PanelBody` has `overflow-y-auto`. Everything above it is `overflow-hidden`.

---

## Core Components API

### `ColumnLayout`

A thin wrapper that adds `overflow-hidden rounded-lg border`. It intentionally does **not** set its own height or width — the consumer controls that. Use it when you want the outer card appearance without `ResizablePanelGroup`, or as a fallback for simpler two-column layouts.

```tsx
import { ColumnLayout } from '@/components/panels';

// Typical usage — consumer anchors the height
<div className="flex-1 min-h-0 overflow-hidden">
  <ColumnLayout className="h-full w-full">
    {/* Panel children */}
  </ColumnLayout>
</div>
```

> For resizable columns (the standard for new pages), use `ResizablePanelGroup`
> directly instead of `ColumnLayout`. See the orchestrator pattern below.

---

### `Panel`

A single column. Full-height flex column with a `border-r` (removed on the last child automatically via `last:border-r-0`).

When wrapped in a `ResizablePanel`, always use `className="flex-1"` — the panel group controls width. Fixed widths are only for non-resizable layouts.

```tsx
import { Panel } from '@/components/panels';

// Inside a ResizablePanel (standard)
<Panel className="flex-1">
  {/* PanelHeader, PanelBody, PanelFooter */}
</Panel>

// Fixed width (non-resizable, e.g. small sheet sidebar)
<Panel className="w-[280px] shrink-0">
  {/* ... */}
</Panel>
```

---

### `PanelHeader`

Structured panel header. Always `shrink-0` and renders a `border-b`.

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Required. Primary heading. |
| `description` | `string?` | Optional subtitle in muted text. |
| `onClose` | `() => void` | Optional. Renders an X button when provided. |
| `actions` | `ReactNode` | Optional. Rendered to the left of the X button. Use for save/action buttons. |

```tsx
import { PanelHeader } from '@/components/panels';

// With a conditional save button in the header
<PanelHeader
  title="Fahrgast bearbeiten"
  description="Stammdaten verwalten"
  onClose={() => nav.clearAll()}
  actions={
    <Button
      size="sm"
      variant={isDirty ? 'default' : 'ghost'}
      disabled={!isDirty}
      className="h-6 px-2 text-xs"
      onClick={() => formRef.current?.submit()}
    >
      Aktualisieren
    </Button>
  }
/>
```

---

### `PanelBody`

The independently scrollable content area. Uses the `min-h-0 flex-1 overflow-y-auto` pattern.

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

Fixed bottom footer. Always `shrink-0` — it never scrolls away even when the panel body is full. Renders children right-aligned with `border-t`.

```tsx
import { PanelFooter } from '@/components/panels';

<PanelFooter>
  <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
  <Button type="submit" form="my-form-id">Speichern</Button>
</PanelFooter>
```

> **Footer + Form wiring:** The submit button uses the HTML `form` attribute to link
> to the `<form>` inside `PanelBody` by id. This avoids nested `<form>` elements
> (invalid HTML) while keeping the button visually outside the scroll area.
>
> ```tsx
> // Inside PanelBody:
> <form id="my-entity-form" onSubmit={form.handleSubmit(handleSubmit)}>
>   <MyFormBody form={form} />
> </form>
>
> // In PanelFooter:
> <Button type="submit" form="my-entity-form">Speichern</Button>
> ```

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
| `onNew` | `() => void?` | If provided, adds a fixed "+ New" footer button. |
| `newLabel` | `string?` | Label for the new button. |
| `width` | `string?` | Optional Tailwind width class. Leave unset when inside a `ResizablePanel` — the group controls width. |

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

## Forms Inside Panels — Patterns

### Header save button + dirty tracking

The recommended pattern for edit forms in Column 2+: the save action lives in
`PanelHeader`'s `actions` slot, enabled only when the form has unsaved changes.

**In the form component** — expose an imperative handle and fire a dirty callback:

```tsx
// your-entity-form.tsx
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';

export interface EntityFormHandle {
  submit: () => void;
}

interface EntityFormProps {
  initialData: Entity | null;
  noCard?: boolean;              // hides internal submit button
  onSuccess?: (e: Entity) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const EntityForm = forwardRef<EntityFormHandle, EntityFormProps>(function EntityForm(
  { initialData, noCard, onSuccess, onDirtyChange }, ref
) {
  const form = useForm({ defaultValues: buildDefaults(initialData) });

  useImperativeHandle(ref, () => ({
    submit: () => void form.handleSubmit(onSubmit)()
  }));

  // Notify parent of dirty state changes
  const isDirty = form.formState.isDirty;
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;
  useEffect(() => { onDirtyChangeRef.current?.(isDirty); }, [isDirty]);

  async function onSubmit(values) {
    const saved = await yourService.update(values);
    form.reset(values); // ← clears isDirty after a successful save
    onSuccess?.(saved);
  }

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
      {/* fields */}
      {!noCard && <Button type="submit">Speichern</Button>}
    </Form>
  );
});
export default EntityForm;
```

**In the detail panel** — wire the ref and track dirty state:

```tsx
// your-detail-panel.tsx
const formRef = useRef<EntityFormHandle>(null);
const [isFormDirty, setIsFormDirty] = useState(false);

<Panel className="flex-1">
  <PanelHeader
    title={entityName}
    onClose={onClose}
    actions={
      <Button
        size="sm"
        variant={isFormDirty ? 'default' : 'ghost'}
        className="h-6 px-2 text-xs"
        disabled={!isFormDirty}
        onClick={() => formRef.current?.submit()}
      >
        Aktualisieren
      </Button>
    }
  />
  <PanelBody>
    <EntityForm
      ref={formRef}
      initialData={entity}
      noCard
      onSuccess={handleSuccess}
      onDirtyChange={setIsFormDirty}
    />
  </PanelBody>
</Panel>
```

### Fixed footer for sub-detail panels (Column 3+)

Sub-panels like rule/sub-item forms use `PanelFooter` as a sibling to `PanelBody`,
linked via the HTML `form` attribute so the button sits outside the scroll area:

```tsx
<Panel className="flex-1">
  <PanelHeader title="Neue Regelfahrt" onClose={onClose} />
  <PanelBody padded={false}>
    <div className="px-6">
      <form id="my-rule-form" onSubmit={form.handleSubmit(handleSubmit)}>
        <MyFormBody form={form} />
      </form>
    </div>
  </PanelBody>
  <PanelFooter>
    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
      Abbrechen
    </Button>
    <Button type="submit" form="my-rule-form" disabled={isSubmitting}>
      {isNew ? 'Hinzufügen' : 'Speichern'}
    </Button>
  </PanelFooter>
</Panel>
```

---

## How to Add a New Column View Page

Follow these steps to add the Miller Columns view to any entity management page.
The Fahrgäste implementation is your reference.

### Step 1 — Add the page toggle

```tsx
// src/app/dashboard/your-page/page.tsx
import { YourViewToggle } from '@/features/your-feature/components/your-view-toggle';

// In pageHeaderAction:
<div className="flex items-center gap-2">
  {!isColumnView && <Link href="...">+ Neu</Link>}
  <YourViewToggle />
</div>
```

Create `your-view-toggle.tsx` by copying `clients-view-toggle.tsx` — only the component name changes. The toggle uses `nuqs` with `shallow: false` to force a server re-render when switching views.

### Step 2 — Create the orchestrator

Use `ResizablePanelGroup` directly (not `ColumnLayout`) so users can drag-resize columns:

```tsx
// src/features/your-feature/components/your-column-view.tsx
'use client';

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { useColumnNavigation } from '@/hooks/use-column-navigation';
import { YourListPanel } from './your-list-panel';
import { YourDetailPanel } from './your-detail-panel';

const COLUMN_KEYS = ['entityId', 'subId'] as const;

export function YourColumnView() {
  const nav = useColumnNavigation(COLUMN_KEYS);
  const { entityId, subId } = nav.values;

  const showDetail = !!entityId;
  const showSub = !!(entityId && entityId !== 'new' && subId);

  return (
    // flex-1 min-h-0: fills the remaining height in PageContainer's flex column
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full w-full"
        autoSaveId="your-entity-column-layout"
      >
        <ResizablePanel id="list" order={1} defaultSize={showDetail ? 22 : 100} minSize={15}>
          <YourListPanel
            selectedId={entityId}
            onSelect={(id) => nav.set({ entityId: id, subId: null })}
            onNew={() => nav.set({ entityId: 'new', subId: null })}
          />
        </ResizablePanel>

        {showDetail && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel id="detail" order={2} defaultSize={showSub ? 44 : 78} minSize={28}>
              {/* key forces full remount when switching between entities */}
              <YourDetailPanel
                key={entityId}
                entityId={entityId}
                onClose={() => nav.clearAll()}
                onSelectSub={(id) => nav.set({ subId: id })}
                onNewSub={() => nav.set({ subId: 'new' })}
              />
            </ResizablePanel>
          </>
        )}

        {showSub && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel id="sub" order={3} defaultSize={34} minSize={22}>
              <YourSubPanel
                parentId={entityId!}
                subId={subId!}
                onClose={() => nav.clear('subId')}
                onSuccess={() => nav.clear('subId')}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
```

**Default size guidelines:**

| Columns visible | List | Detail | Sub |
|---|---|---|---|
| 1 only | 100% | — | — |
| 1 + 2 | 22% | 78% | — |
| 1 + 2 + 3 | 22% | 44% | 34% |

### Step 3 — Build the list panel

```tsx
// src/features/your-feature/components/your-list-panel.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { PanelList } from '@/components/panels';
import { yourService, YourEntity } from '../api/your.service';
import { toast } from 'sonner';

export function YourListPanel({ selectedId, onSelect, onNew }) {
  const [items, setItems] = useState<YourEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  const fetchItems = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await yourService.getAll({ search: q });
      setItems(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(debouncedSearch); }, [debouncedSearch, fetchItems]);

  // Expose refresh to sibling panels (call after create/delete)
  useEffect(() => {
    (window as any).__refreshYourList = () => fetchItems(debouncedSearch);
    return () => { delete (window as any).__refreshYourList; };
  }, [fetchItems, debouncedSearch]);

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
      searchPlaceholder="Eintrag suchen..."
      emptyMessage="Keine Einträge gefunden."
      onNew={onNew}
      newLabel="Neuer Eintrag"
    />
  );
}
```

### Step 4 — Build the detail panel

Wire `forwardRef` + `onDirtyChange` for the header save button. Always pass `key={entityId}` from the orchestrator (not inside this component — the parent sets it).

```tsx
// src/features/your-feature/components/your-detail-panel.tsx
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader, PanelBody } from '@/components/panels';
import YourEntityForm, { YourEntityFormHandle } from './your-entity-form';

export function YourDetailPanel({ entityId, onClose, onSelectSub, onNewSub }) {
  const isNew = entityId === 'new';
  const formRef = useRef<YourEntityFormHandle>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) { setEntity(null); setLoading(false); return; }
    setLoading(true);
    yourService.getById(entityId)
      .then(setEntity)
      .finally(() => setLoading(false));
  }, [entityId, isNew]);

  return (
    <Panel className="flex-1">
      <PanelHeader
        title={isNew ? 'Neuer Eintrag' : (entity?.name ?? '...')}
        description={isNew ? 'Neuen Eintrag anlegen' : 'Eintrag bearbeiten'}
        onClose={onClose}
        actions={
          !loading && (
            <Button
              size="sm"
              variant={isFormDirty ? 'default' : 'ghost'}
              className="h-6 px-2 text-xs"
              disabled={!isFormDirty}
              onClick={() => formRef.current?.submit()}
            >
              {isNew ? 'Anlegen' : 'Aktualisieren'}
            </Button>
          )
        }
      />
      <PanelBody padded>
        {loading ? (
          <Spinner />
        ) : (
          <YourEntityForm
            ref={formRef}
            initialData={entity}
            noCard
            onSuccess={handleSuccess}
            onDirtyChange={setIsFormDirty}
          />
        )}
      </PanelBody>
    </Panel>
  );
}
```

### Step 5 — (Optional) Build the sub-panel

Same pattern as the detail panel but uses `PanelFooter` for the submit button (Column 3+ forms are typically self-contained). Extract the form fields into a `YourFormBody` component shared between a `Sheet` and the `Panel`. See `recurring-rule-form-body.tsx` as the reference.

```tsx
<Panel className="flex-1">
  <PanelHeader title="..." onClose={onClose} />
  <PanelBody padded={false}>
    <div className="px-6">
      <form id="your-sub-form" onSubmit={form.handleSubmit(handleSubmit)}>
        <YourFormBody form={form} showIsActive={!isNew} />
      </form>
    </div>
  </PanelBody>
  <PanelFooter>
    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Abbrechen</Button>
    <Button type="submit" form="your-sub-form" disabled={isSubmitting}>
      {isNew ? 'Hinzufügen' : 'Speichern'}
    </Button>
  </PanelFooter>
</Panel>
```

---

## Design Decisions & Rationale

### Why `ResizablePanelGroup` instead of fixed widths?

Fixed pixel widths (e.g. `w-[460px]`) overflow on 1280px laptops and leave dead whitespace on wide monitors. `ResizablePanelGroup` with percentage-based defaults scales to any viewport and lets users set their own preferred proportions — sizes persist per-session via `autoSaveId` (localStorage). This is how Linear, VS Code, and Notion handle multi-column layouts.

### Why `key={entityId}` on the detail panel?

`useForm` (React Hook Form) reads `defaultValues` only on initial mount. When a user selects a different entity, the panel component is reused and its props change — but the form fields still show the old entity's data. Setting `key={entityId}` forces a full React unmount/remount whenever the entity changes. This resets all internal state (form values, dirty flag, loaded rules) cleanly. It's the idiomatic React pattern: "when the subject changes, I want a fresh component".

### Why the `forwardRef` + `onDirtyChange` pattern?

The standard approach (submit button inside the form) can't put the button in the panel header. `forwardRef` exposes `submit()` as an imperative handle, and `onDirtyChange` allows the parent to reactively enable/disable the header button without prop-drilling the entire form state. After a successful save, `form.reset(values)` is called to clear `isDirty` so the button returns to its disabled state automatically.

### Why URL params instead of component state?

URL params give you deep linking, browser back/forward, and page refresh for free. If a user shares a URL with `?clientId=abc&ruleId=xyz`, it opens exactly that column state. Component state would lose all context on refresh.

### Why `useQueryStates` (batched) instead of multiple `useQueryState` calls?

When selecting a client, you also need to clear the rule (it belongs to the old client). With individual `useQueryState` hooks, this creates two separate URL changes and two history entries — pressing back would take you through an intermediate broken state. `useQueryStates` batches all changes into one atomic URL push.

### Why render props for `PanelList`?

Different entity types need different row layouts (name + city for clients, name + plate for vehicles, etc.). A render prop keeps `PanelList` generic while letting each feature own its visual row design.

### Why `FormProvider` (not `<Form>`) inside shared form body components?

`<Form>` from `@/components/ui/form` renders an actual `<form>` element. If the parent panel already has a `<form>` element (which it needs to wire `handleSubmit`), using `<Form>` creates **nested `<form>` elements — invalid HTML**. Instead, shared form body components use `<FormProvider {...form}>` (from `react-hook-form`) which only provides context without rendering a DOM element. The `<form>` element lives in the parent.

### Why `border-r last:border-r-0` instead of gaps?

A gap between panels shows the page background color between columns, breaking the "single card" illusion. `border-r` on each panel except the last gives a clean internal divider with no visual leakage.

---

## Common Pitfalls

**Panel scroll not working (whole page scrolls instead):**
`PageContainer` with `scrollable={false}` must provide the height anchor. Check that it renders `h-[calc(100dvh-52px)] overflow-hidden`. The `ResizablePanelGroup` inside the orchestrator must have `h-full w-full`, and its wrapper div must have `flex-1 min-h-0 overflow-hidden`. Without this chain, `overflow-y-auto` on `PanelBody` has no bounded height to overflow against.

**Stale form values when switching entities:**
`useForm` initialises from `defaultValues` only once at mount time. Switching from entity A to entity B (or to 'new') doesn't reset the form. Fix: always pass `key={entityId}` on the detail panel component in the orchestrator so React fully remounts it when the entity changes.

**Footer button submits the wrong form (or does nothing):**
When using `PanelFooter` with `type="submit"`, the button must reference its `<form>` by id via the HTML `form` attribute: `<Button type="submit" form="my-form-id">`. The `<form id="my-form-id">` lives inside `PanelBody`. Without this, the button either submits the nearest ancestor form or does nothing.

**`isDirty` stays `true` after saving:**
`react-hook-form`'s `isDirty` compares current values against `defaultValues`. After a successful save, call `form.reset(submittedValues)` to update the default values baseline — this clears `isDirty` and disables the header button automatically.

**`useColumnNavigation` infers `string` instead of literal union:**
Always pass the keys array `as const`. Without it, TypeScript infers `string[]` and you lose type safety on `nav.values.clientId`.

**Nested `<form>` elements in shared form body components:**
If your shared form body uses `<Form>` from shadcn, it renders a `<form>` element. The parent panel also has a `<form>`. This creates nested forms — invalid HTML with unpredictable browser behavior. Replace the `<Form>` wrapper in the shared component with `<FormProvider {...form}>` from `react-hook-form`.

**Creating a new entity and the list doesn't update:**
After a successful create, call `(window as any).__refreshYourList?.()` (or the equivalent function registered by your list panel via `useEffect`) to trigger a re-fetch in Column 1.

**Column sizes don't persist between sessions:**
Add `autoSaveId="your-entity-column-layout"` to `ResizablePanelGroup`. This saves user-adjusted sizes to `localStorage` keyed by that id. Make the id unique per page to avoid conflicts.
