# Clerk Setup Guide

This guide covers the setup and configuration of Clerk features used in this starter template.

## Clerk Scopes Required

- **Authentication** - User sign-in/sign-up and session management
- **Organizations** - Multi-tenant workspace management (see setup below)
- **Billing** - Organization-level subscription management (see setup below)

## Clerk Organizations Setup (Workspaces & Teams)

This starter kit includes multi-tenant workspace management powered by **Clerk Organizations**. To enable this feature:

### Enable Organizations in Clerk Dashboard:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **configure**
3. Click **Organizations settings**
4. Configure default roles if needed in the roles and permissions.

### Server-Side Permission Checks:

- This starter follows [Clerk's recommended patterns](https://clerk.com/blog/how-to-build-multitenant-authentication-with-clerk)

### Navigation RBAC System:

- Fully client-side navigation filtering using `useNav` hook
- Supports `requireOrg`, `permission`, and `role` checks (all client-side, instant)
- Configured in `src/config/nav-config.ts` with `access` properties
- See `docs/nav-rbac.md` for detailed documentation

### For more information, see:

- [Clerk Organizations documentation](https://clerk.com/docs/organizations/overview)
- [Multi-tenant authentication guide](https://clerk.com/blog/how-to-build-multitenant-authentication-with-clerk)

## Clerk Billing Setup (Organization Subscriptions)

This starter kit includes **Clerk Billing for B2B** to manage organization-level subscriptions. Plans and features are managed through the Clerk Dashboard, and the application checks access using Clerk's `has()` function.

> [!WARNING]
> Billing is currently in Beta and its APIs are experimental and may undergo breaking changes. To mitigate potential disruptions, we recommend pinning your SDK and `clerk-js` package versions.

### Key Features:

- Organization-level subscription management
- Plan-based access control using `<Protect>` component
- Feature-based authorization
- Integrated Stripe payment processing
- Server-side plan/feature checks using `has()` function

### Billing Cost Structure:

Clerk Billing costs **0.7% per transaction**, plus transaction fees which are paid directly to Stripe. Clerk Billing is **not** the same as Stripe Billing. Plans and pricing are managed directly through the Clerk Dashboard and won't sync with your existing Stripe products or plans. Clerk uses Stripe **only** for payment processing, so you don't need to set up Stripe Billing.

### Setup Instructions:

#### 1. Enable Billing:

- Navigate to [Billing Settings](https://dashboard.clerk.com/~/billing/settings) in the Clerk Dashboard
- Enable billing for your application
- Choose payment gateway:
  - **Clerk development gateway**: A shared **test** Stripe account for development instances. This allows developers to test and build Billing flows **in development** without needing to create and configure a Stripe account.
  - **Stripe account**: Use your own Stripe account for production. **A Stripe account created for a development instance cannot be used for production**. You will need to create a separate Stripe account for your production environment.

#### 2. Create Plans:

- Navigate to [Plans page](https://dashboard.clerk.com/~/billing/plans) in the Clerk Dashboard
- Select **Plans for Organizations** tab
- Click **Add Plan** and create plans (e.g., `free`, `pro`, `team`)
- Set pricing and billing intervals
- Toggle **Publicly available** to show in `<PricingTable />` and `<OrganizationProfile />` components

#### 3. Add Features to Plans:

- You can add Features when creating a Plan, or add them later:
  1. Navigate to the [Plans](https://dashboard.clerk.com/~/billing/plans) page
  2. Select the Plan you'd like to add a Feature to
  3. In the **Features** section, select **Add Feature**
- Feature names in Clerk Dashboard should match what you check in code

#### 4. Usage in Code:

**Server-side checks using `has()`:**

```typescript
// Check if organization has a Plan
const hasPremiumAccess = has({ plan: 'gold' });

// Check if organization has a Feature
const hasPremiumAccess = has({ feature: 'widgets' });
```

The `has()` method is available on the auth object and checks if the Organization has been granted a specific type of access control (Role, Permission, Feature, or Plan) and returns a boolean value.

**Client-side protection using `<Protect>`:**

```tsx
<Protect
  plan='bronze'
  fallback={<p>Only subscribers to the Bronze plan can access this content.</p>}
>
  <h1>Exclusive Bronze Content</h1>
</Protect>
```

Or protect by Feature:

```tsx
<Protect
  feature='premium_access'
  fallback={
    <p>
      Only subscribers with the Premium Access feature can access this content.
    </p>
  }
>
  <h1>Exclusive Premium Content</h1>
</Protect>
```
