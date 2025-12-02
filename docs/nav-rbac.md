# Simplified Navigation RBAC System

## Overview

This document explains the fully client-side RBAC (Role-Based Access Control) system for navigation items.

**Key Insight**: Navigation visibility is UX only, not security. We can check everything client-side using Clerk's hooks!

## Architecture

### Core Files

1. **`src/hooks/use-nav.ts`** - Single hook that handles all filtering logic (fully client-side)
2. **`src/types/index.ts`** - Type definitions with `access` property

### Why Client-Side?

- **Navigation visibility is UX only** - Users can't bypass security by seeing/hiding nav items
- **Clerk provides all data client-side** - `useOrganization()` gives us `membership.permissions` and `membership.role`
- **Zero server calls** - Instant filtering, no loading states, no UI flashing
- **Better performance** - No network latency, no async complexity

**Note**: For actual security (API routes, server actions, page protection), always use server-side checks.

## Performance Characteristics

### All Checks Are Synchronous

✅ **requireOrg**: Client-side check using `useOrganization()`  
✅ **permission**: Client-side check using `membership.permissions` array  
✅ **role**: Client-side check using `membership.role`  
⚠️ **plan/feature**: Requires server-side check (see below)

### Zero Server Calls

- All navigation filtering happens synchronously
- No loading states
- No UI flashing
- Instant results

## Usage

### In `nav-config.ts`

```typescript
{
  title: 'Teams',
  url: '/dashboard/workspaces/team',
  icon: 'userPen',
  // Simple: requireOrg (client-side check, instant)
  access: { requireOrg: true }
}

{
  title: 'Admin Panel',
  url: '/dashboard/admin',
  icon: 'settings',
  // All client-side checks - instant!
  access: {
    requireOrg: true,
    permission: 'org:admin:manage',  // Client-side from membership.permissions
    role: 'admin'  // Client-side from membership.role
}
```

### In Components

```typescript
import { useFilteredNavItems } from '@/hooks/use-nav-filter';

function MyComponent() {
  const filteredItems = useFilteredNavItems(navItems);
  // filteredItems is automatically filtered based on RBAC
}
```

### Plan/Feature Checks

Plans and features require Clerk's `has()` function which is server-side only. Options:

1. **Store in organization metadata** (recommended for navigation):

   ```typescript
   // In your organization setup
   organization.publicMetadata.plan = 'pro';

   // In nav-config.ts
   access: {
     requireOrg: true,
     // Check metadata instead of plan
   }
   ```

2. **Show item, protect at page level** (current approach):

   - Navigation item is shown
   - Page component checks server-side and redirects/shows error if needed

3. **Use server action** (if you really need it):
   - Only for navigation items that absolutely need plan/feature checks
   - Most navigation items won't need this

## Scalability

### Adding New Items

Just add to `nav-config.ts`:

```typescript
{
  title: 'New Feature',
  url: '/dashboard/new',
  icon: 'star',
  access: { plan: 'pro' }  // That's it!
}
```

The system automatically:

- Filters it in sidebar
- Filters it in kbar
- Handles async checks if needed
- Handles sync checks immediately

### Adding New Access Types

1. Add to `PermissionCheck` interface in `src/app/actions/rbac.ts`
2. Add check logic in `checkAccess()` function
3. Update `use-nav.ts` to handle the new type

## Comparison: Before vs After

### Before (Overcomplicated)

- 4 files with complex logic
- Multiple hooks and utilities
- Unclear data flow
- Potential for bugs

### After (Simplified)

- 1 main hook file
- Clear, linear logic
- Easy to understand
- Easy to maintain

## Best Practices

1. **Use `requireOrg: true` for simple cases** - It's instant and requires no server call
2. **Combine checks when possible** - `{ requireOrg: true, permission: '...' }` is more efficient than separate checks
3. **Avoid unnecessary checks** - Don't add `access` if the item should always be visible

## Migration from Old System

The old `visible` function still works for backward compatibility:

```typescript
// Old way (still works)
visible: (context) => !!context?.organization;

// New way (recommended)
access: {
  requireOrg: true;
}
```

## Future Improvements

Potential optimizations if needed:

1. Cache permission checks (e.g., React Query)
2. Prefetch permissions on app load
3. Optimistic UI updates

But for now, the current implementation is:

- ✅ Simple
- ✅ Fast
- ✅ Scalable
- ✅ Maintainable
