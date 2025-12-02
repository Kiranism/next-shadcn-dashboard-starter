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
2. Navigate to **Organizations Settings**
3. Click **Enable Organizations**
4. Configure default roles (admin, member, viewer) if needed

### Server-Side Permission Checks:

- This starter follows [Clerk's recommended patterns](https://clerk.com/blog/how-to-build-multitenant-authentication-with-clerk)
- Server-side utilities in `src/lib/server-auth.ts` use Clerk's `has()` function
- Example server actions in `src/lib/server-actions-example.ts`
- Example API route in `src/app/api/example/route.ts`
- Always validate permissions on the server, not just client-side

### Navigation RBAC System:

- Fully client-side navigation filtering using `useFilteredNavItems` hook
- Supports `requireOrg`, `permission`, and `role` checks (all client-side, instant)
- Zero server calls for navigation visibility (UX only, not security)
- Configured in `src/config/nav-config.ts` with `access` properties
- See `docs/NAV_RBAC_SIMPLIFIED.md` for detailed documentation

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

> [!TIP]
> What is the **Publicly available** option?
>
> Plans appear in some Clerk components depending on what kind of Plan it is. All Plans can appear in the `<PricingTable />` component. If it's an Organization Plan, it can appear in the `<OrganizationProfile />` component. When creating or editing a Plan, if you'd like to hide it from appearing in Clerk components, you can toggle the **Publicly available** option off.

#### 3. Add Features to Plans:

- [Features](https://clerk.com/docs/guides/secure/features) make it easy to give entitlements to your Plans
- You can add Features when creating a Plan, or add them later:
  1. Navigate to the [Plans](https://dashboard.clerk.com/~/billing/plans) page
  2. Select the Plan you'd like to add a Feature to
  3. In the **Features** section, select **Add Feature**
- Feature names in Clerk Dashboard should match what you check in code

> [!TIP]
> If your Clerk instance has existing [Custom Permissions](https://clerk.com/docs/guides/organizations/roles-and-permissions), the corresponding Features from those Permissions will automatically be added to the free Plan for Orgs. This ensures that Organization members get the same set of Custom Permissions when Billing is enabled, because all Organizations start on the free Plan.

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

### Critical Note on Custom Permissions

> [!IMPORTANT]
> Permission-based authorization checks link with Feature-based authorization checks. Custom Permissions will **only** appear in the session token (JWT) and in API responses (including the result of the `has()` check) if the Feature part of the Permission key (`org:<feature>:<permission>`) **is a Feature included in the Organization's active Plan**.

If the Feature is not part of the Plan, the `has()` check for Permissions using that Feature will return `false`, and those Permissions will **not** be represented in the session token—**even if the user has the Custom Permission assigned**.

**Example:**

To check the Custom Permission `org:teams:manage` (where `teams` is the Feature), the user's Organization must be subscribed to a Plan that includes the `teams` Feature. Otherwise, the authorization check will always return `false`, even if the user has the Custom Permission.

### Important Notes:

- Clerk Billing manages subscriptions but **does not track usage** - you still need to track usage separately
- For detailed implementation guide, see `docs/CLERK_BILLING_IMPLEMENTATION.md`

### Resources:

- [Clerk Billing for B2B Documentation](https://clerk.com/docs/react/guides/billing/for-b2b)
- [Clerk Billing Overview](https://clerk.com/docs/billing/overview)
