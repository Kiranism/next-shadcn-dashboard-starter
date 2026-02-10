# AGENTS.md - AI Coding Agent Reference

This file provides essential information for AI coding agents working on this project. It contains project-specific details, conventions, and guidelines that complement the README.

---

## Project Overview

**Next.js Admin Dashboard Starter** is a production-ready admin dashboard template built with:

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (New York style)
- **Authentication**: Clerk (with Organizations/Billing support)
- **Error Tracking**: Sentry
- **Package Manager**: Bun (preferred) or npm

The project follows a feature-based folder structure designed for scalability in SaaS applications, internal tools, and admin panels.

---

## Technology Stack Details

### Core Framework & Runtime
- Next.js 16.0.10 with App Router
- React 19.2.0
- TypeScript 5.7.2 with strict mode enabled

### Styling & UI
- Tailwind CSS v4 (using `@import 'tailwindcss'` syntax)
- PostCSS with `@tailwindcss/postcss` plugin
- shadcn/ui component library (Radix UI primitives)
- CSS custom properties for theming (OKLCH color format)

### State Management
- Zustand 5.x for global state
- Nuqs for URL search params state management
- React Hook Form + Zod for form handling

### Authentication & Authorization
- Clerk for authentication and user management
- Clerk Organizations for multi-tenant workspaces
- Clerk Billing for subscription management (B2B)
- Client-side RBAC for navigation visibility

### Data & APIs
- TanStack Table for data tables
- Recharts for analytics/charts
- Mock API utilities in `src/constants/mock-api.ts`

### Development Tools
- ESLint 8.x with Next.js core-web-vitals config
- Prettier 3.x with prettier-plugin-tailwindcss
- Husky for git hooks
- lint-staged for pre-commit formatting

---

## Project Structure

```
/src
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication routes (sign-in, sign-up)
│   ├── dashboard/         # Dashboard routes
│   │   ├── overview/      # Parallel routes (@area_stats, @bar_stats, etc.)
│   │   ├── product/       # Product management pages
│   │   ├── kanban/        # Kanban board page
│   │   ├── workspaces/    # Organization management
│   │   ├── billing/       # Subscription billing
│   │   ├── exclusive/     # Pro plan feature example
│   │   └── profile/       # User profile
│   ├── api/               # API routes (if any)
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Landing page
│   ├── global-error.tsx   # Sentry-integrated error boundary
│   └── not-found.tsx      # 404 page
│
├── components/
│   ├── ui/                # shadcn/ui components (50+ components)
│   ├── layout/            # Layout components (sidebar, header, etc.)
│   ├── forms/             # Form field wrappers
│   ├── themes/            # Theme system components
│   ├── kbar/              # Command+K search bar
│   ├── icons.tsx          # Icon registry
│   └── ...
│
├── features/              # Feature-based modules
│   ├── auth/              # Authentication components
│   ├── overview/          # Dashboard analytics
│   ├── products/          # Product management
│   ├── kanban/            # Kanban board with dnd-kit
│   └── profile/           # Profile management
│
├── config/                # Configuration files
│   ├── nav-config.ts      # Navigation with RBAC
│   └── ...
│
├── hooks/                 # Custom React hooks
│   ├── use-nav.ts         # RBAC navigation filtering
│   ├── use-data-table.ts  # Data table state
│   └── ...
│
├── lib/                   # Utility functions
│   ├── utils.ts           # cn() and formatters
│   ├── searchparams.ts    # Search param utilities
│   └── ...
│
├── types/                 # TypeScript type definitions
│   └── index.ts           # Core types (NavItem, etc.)
│
└── styles/                # Global styles
    ├── globals.css        # Tailwind imports + view transitions
    ├── theme.css          # Theme imports
    └── themes/            # Individual theme files

/docs                      # Documentation
│   ├── clerk_setup.md     # Clerk configuration guide
│   ├── nav-rbac.md        # Navigation RBAC documentation
│   └── themes.md          # Theme customization guide

/__CLEANUP__               # Feature removal scripts
    ├── scripts/           # Cleanup automation
    └── clerk/             # Templates after Clerk removal
```

---

## Build & Development Commands

```bash
# Install dependencies
bun install

# Development server
bun run dev          # Starts at http://localhost:3000

# Build for production
bun run build

# Start production server
bun run start

# Linting
bun run lint         # Run ESLint
bun run lint:fix     # Fix ESLint issues and format
bun run lint:strict  # Zero warnings tolerance

# Formatting
bun run format       # Format with Prettier
bun run format:check # Check formatting

# Git hooks
bun run prepare      # Install Husky hooks
```

---

## Environment Configuration

Copy `env.example.txt` to `.env.local` and configure:

### Required for Authentication (Clerk)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard/overview"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard/overview"
```

### Optional for Error Tracking (Sentry)
```env
NEXT_PUBLIC_SENTRY_DSN=https://...@....ingest.sentry.io/...
NEXT_PUBLIC_SENTRY_ORG=your-org
NEXT_PUBLIC_SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=sntrys_...
NEXT_PUBLIC_SENTRY_DISABLED="false"  # Set to "true" to disable in dev
```

**Note**: Clerk supports "keyless mode" - the app works without API keys for initial development.

---

## Code Style Guidelines

### TypeScript
- Strict mode enabled
- Use explicit return types for public functions
- Prefer interface over type for object definitions
- Use `@/*` alias for imports from src

### Formatting (Prettier)
```json
{
  "singleQuote": true,
  "jsxSingleQuote": true,
  "semi": true,
  "trailingComma": "none",
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### ESLint Rules
- `@typescript-eslint/no-unused-vars`: warn
- `no-console`: warn
- `react-hooks/exhaustive-deps`: warn
- `import/no-unresolved`: off (handled by TypeScript)

### Component Conventions
- Use function declarations for components: `function ComponentName() {}`
- Props interface named `{ComponentName}Props`
- shadcn/ui components use `cn()` utility for class merging
- Server components by default, `'use client'` only when needed

---

## Theming System

The project uses a sophisticated multi-theme system with 6 built-in themes:

- `vercel` (default)
- `claude`
- `neobrutualism`
- `supabase`
- `mono`
- `notebook`

### Theme Files
- CSS files: `src/styles/themes/{theme-name}.css`
- Theme registry: `src/components/themes/theme.config.ts`
- Font config: `src/components/themes/font.config.ts`
- Active theme provider: `src/components/themes/active-theme.tsx`

### Adding a New Theme
1. Create `src/styles/themes/your-theme.css` with `[data-theme='your-theme']` selector
2. Import in `src/styles/theme.css`
3. Add to `THEMES` array in `src/components/themes/theme.config.ts`
4. (Optional) Add fonts in `font.config.ts`
5. (Optional) Set as default in `theme.config.ts`

See `docs/themes.md` for detailed theming guide.

---

## Navigation & RBAC System

### Navigation Configuration
Navigation is defined in `src/config/nav-config.ts`:

```typescript
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    shortcut: ['d', 'd'],
    access: { requireOrg: true }  // RBAC check
  }
];
```

### Access Control Properties
- `requireOrg: boolean` - Requires active organization
- `permission: string` - Requires specific permission
- `role: string` - Requires specific role
- `plan: string` - Requires specific subscription plan
- `feature: string` - Requires specific feature

### Client-Side Filtering
The `useFilteredNavItems()` hook in `src/hooks/use-nav.ts` filters navigation client-side using Clerk's `useOrganization()` and `useUser()` hooks. This is for UX only - actual security checks must happen server-side.

---

## Authentication Patterns

### Protected Routes
Dashboard routes use Clerk's middleware pattern. Pages that require organization:

```tsx
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default async function Page() {
  const { orgId } = await auth();
  if (!orgId) redirect('/dashboard/workspaces');
  // ...
}
```

### Plan/Feature Protection
Use Clerk's `<Protect>` component for client-side:

```tsx
import { Protect } from '@clerk/nextjs';

<Protect plan="pro" fallback={<UpgradePrompt />}>
  <PremiumContent />
</Protect>
```

Use `has()` function for server-side checks:

```tsx
import { auth } from '@clerk/nextjs';

const { has } = await auth();
const hasFeature = has({ feature: 'premium_access' });
```

---

## Data Fetching Patterns

### Server Components (Default)
Fetch data directly in async components:

```tsx
export default async function ProductPage() {
  const products = await getProducts(); // Your data fetch
  return <ProductTable data={products} />;
}
```

### URL State Management
Use `nuqs` for search params state:

```tsx
import { useQueryState } from 'nuqs';

const [search, setSearch] = useQueryState('search');
```

### Data Tables
Tables use TanStack Table with server-side filtering:
- Column definitions in `features/*/components/*-tables/columns.tsx`
- Table component in `src/components/ui/table/data-table.tsx`
- Filter parsers in `src/lib/parsers.ts`

---

## Error Handling & Monitoring

### Sentry Integration
Sentry is configured for both client and server:
- Client config: `src/instrumentation-client.ts`
- Server config: `src/instrumentation.ts`
- Global error: `src/app/global-error.tsx`

To disable Sentry in development:
```env
NEXT_PUBLIC_SENTRY_DISABLED="true"
```

### Error Boundaries
- `global-error.tsx` - Catches all errors, reports to Sentry
- Parallel route `error.tsx` files for specific sections

---

## Testing Strategy

**Note**: This project does not include a test suite by default. Consider adding:

- **Unit tests**: Vitest or Jest for utilities and hooks
- **Component tests**: React Testing Library for UI components
- **E2E tests**: Playwright for critical user flows

Recommended test locations:
```
/src
  /__tests__           # Unit tests
  /features/*/tests    # Feature tests
/e2e                   # Playwright tests
```

---

## Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Add environment variables in dashboard
3. Deploy

### Environment Variables for Production
Ensure these are set in your deployment platform:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- All `NEXT_PUBLIC_*` variables for client-side access
- `SENTRY_*` variables if using error tracking

### Build Considerations
- Output: Static + Server (default Next.js)
- Images: Configured for `api.slingacademy.com`, `img.clerk.com`, `clerk.com`
- Sentry source maps uploaded automatically in CI

---

## Feature Cleanup System

The `__CLEANUP__` folder contains scripts to remove optional features:

```bash
# List available features
node __CLEANUP__/scripts/cleanup.js --list

# Remove specific features
node __CLEANUP__/scripts/cleanup.js clerk    # Remove auth/org/billing
node __CLEANUP__/scripts/cleanup.js kanban   # Remove kanban board
node __CLEANUP__/scripts/cleanup.js sentry   # Remove error tracking
```

**Safety**: Script requires git repository with at least one commit. Use `--force` to skip.

After cleanup, delete the `__CLEANUP__` folder.

---

## Common Development Tasks

### Adding a New Page
1. Create route: `src/app/dashboard/new-page/page.tsx`
2. Add navigation item in `src/config/nav-config.ts`
3. Create feature components in `src/features/new-feature/`

### Adding a New API Route
1. Create: `src/app/api/my-route/route.ts`
2. Export HTTP method handlers: `GET`, `POST`, etc.

### Adding a shadcn Component
```bash
npx shadcn add component-name
```

### Adding a New Theme
See "Theming System" section above or `docs/themes.md`.

---

## Troubleshooting

### Common Issues

**Build fails with Tailwind errors**
- Ensure using Tailwind CSS v4 syntax (`@import 'tailwindcss'`)
- Check `postcss.config.js` uses `@tailwindcss/postcss`

**Clerk keyless mode popup**
- Normal in development without API keys
- Click popup to claim application or set env variables

**Theme not applying**
- Check theme name matches in CSS `[data-theme]` and `theme.config.ts`
- Verify theme CSS is imported in `theme.css`

**Navigation items not showing**
- Check `access` property in nav config
- Verify user has required org/permission/role

---

## External Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Clerk Next.js SDK](https://clerk.com/docs/references/nextjs)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [TanStack Table](https://tanstack.com/table/latest)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

## Notes for AI Agents

1. **Always use `cn()` for className merging** - never concatenate strings manually
2. **Respect the feature-based structure** - put new feature code in `src/features/`
3. **Server components by default** - only add `'use client'` when using browser APIs or React hooks
4. **Type safety first** - avoid `any`, prefer explicit types
5. **Follow existing patterns** - look at similar components before creating new ones
6. **Environment variables** - prefix with `NEXT_PUBLIC_` for client-side access
7. **shadcn components** - don't modify files in `src/components/ui/` directly; extend them instead
