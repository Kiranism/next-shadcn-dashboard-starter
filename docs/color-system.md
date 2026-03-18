# Color System Guide

This document defines the rules for using color in this project. Follow it whenever adding new UI or reviewing existing code.

---

## The Two Rules

Every color decision falls into one of two categories:

### Rule 1 — UI Chrome → Theme Tokens

Any color used for layout, surface, border, or generic interactive state must come from the theme token system. These adapt automatically to all 6 themes (Vercel, Claude, Neobrutualism, Supabase, Mono, Notebook) and dark mode.

| Use case | Correct class |
|---|---|
| Page / card background | `bg-background`, `bg-card` |
| Subdued surface (e.g. tabs, input area) | `bg-muted`, `bg-muted/60` |
| Default text | `text-foreground` |
| Subdued / helper text | `text-muted-foreground` |
| Borders and dividers | `border-border` |
| Primary action / brand color | `bg-primary`, `text-primary` |
| Focus ring | `ring-ring` |
| Inverted badge (dark bg, light text) | `bg-foreground text-background` |
| Button hover tint | `hover:bg-primary/10` |

Never use `bg-slate-*`, `bg-white`, `bg-black`, `text-slate-*`, `border-slate-*` for chrome. These are hardcoded and break in dark mode and themed variants.

**Example — wrong:**
```tsx
<div className="bg-slate-100 text-slate-600 border-slate-200">...</div>
```

**Example — correct:**
```tsx
<div className="bg-muted text-muted-foreground border-border">...</div>
```

---

### Rule 2 — Status / Semantic Colors → `src/lib/trip-status.ts`

Status colors (completed, assigned, in_progress, cancelled, pending) carry universal semantic meaning (green = done, red = error, amber = in-progress, blue = info). These are intentionally hardcoded Tailwind palette colors — but they are centralized in one file and always include `dark:` variants.

**Never scatter status color logic in components.** Always import from the utility:

```typescript
import { tripStatusBadge, tripStatusLabels, type TripStatus } from '@/lib/trip-status';
```

**Badge / chip:**
```tsx
<Badge className={tripStatusBadge({ status: trip.status as TripStatus })}>
  {tripStatusLabels[trip.status as TripStatus]}
</Badge>
```

**Row highlight:**
```tsx
import { tripStatusRow } from '@/lib/trip-status';

<tr className={cn('border-l-4', tripStatusRow({ status: trip.status as TripStatus }))}>
```

**Adding a new status** — only edit `src/lib/trip-status.ts`. Add the status to `TripStatus`, `tripStatusBadge`, `tripStatusRow`, and `tripStatusLabels`. Every component that imports the utility gets the new color for free.

---

## Dynamic DB Colors (Billing Types)

Billing type colors come from the database (`billing_type.color`). Use `color-mix()` to tint backgrounds, but always blend toward `var(--background)` — never `white` — so it works in dark mode.

**Wrong (breaks in dark mode):**
```ts
`color-mix(in srgb, ${color}, white 85%)`
```

**Correct:**
```ts
`color-mix(in srgb, ${color}, var(--background) 85%)`
```

For borders and text, use the raw `color` value directly from the DB — it is already readable against any background.

---

## Quick Reference

| Scenario | Solution |
|---|---|
| Status badge (completed, cancelled, etc.) | `tripStatusBadge({ status })` from `@/lib/trip-status` |
| Row tint by status | `tripStatusRow({ status })` from `@/lib/trip-status` |
| DB color tinted background | `color-mix(in srgb, ${color}, var(--background) 85%)` |
| Any surface / layout color | Theme tokens (`bg-muted`, `border-border`, etc.) |
| Inverted badge (e.g. Rollstuhl) | `bg-foreground text-background` |
| New status color needed | Edit `src/lib/trip-status.ts` only |
| Dark mode for a semantic color | Already handled in `trip-status.ts` via `dark:` variants |

---

## What Not To Do

- Do not use `bg-white` or `bg-black` — use `bg-background` / `bg-foreground`
- Do not use `text-slate-*` or `bg-slate-*` for chrome — use `text-muted-foreground` / `bg-muted`
- Do not duplicate status color logic in components — import from `trip-status.ts`
- Do not use `color-mix(..., white ...)` for DB colors — always blend toward `var(--background)`
- Do not add new hardcoded palette colors without `dark:` variants
