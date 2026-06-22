<h1 align="center">Admin Dashboard Template with Next.js &amp; Shadcn UI</h1>

<div align="center">Open source admin dashboard starter built with Next.js 16, shadcn/ui, Tailwind CSS, and TypeScript</div>

<br />

<div align="center">
  <a href="https://dub.sh/shadcn-dashboard"><strong>View Demo</strong></a>
</div>
<br />
<div align="center">
  <img src="/public/shadcn-dashboard.png" alt="Shadcn Dashboard Cover" style="max-width: 100%; border-radius: 8px;" />
</div>

<p align="center">
  <a href="https://github.com/Kiranism/next-shadcn-dashboard-starter/stargazers"><img src="https://img.shields.io/github/stars/Kiranism/next-shadcn-dashboard-starter?style=social" alt="GitHub stars" /></a>
  <a href="https://github.com/Kiranism/next-shadcn-dashboard-starter/network/members"><img src="https://img.shields.io/github/forks/Kiranism/next-shadcn-dashboard-starter?style=social" alt="Forks" /></a>
  <a href="https://github.com/Kiranism/next-shadcn-dashboard-starter/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Kiranism/next-shadcn-dashboard-starter" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js" />
  <a href="https://go.clerk.com/ILdYhn7"><img src="https://img.shields.io/badge/Sponsored_by-Clerk-6C47FF?style=flat-square&logo=clerk" alt="Sponsored by Clerk" /></a>
</p>

## Overview

An open source admin dashboard starter built with Next.js 16, shadcn/ui, TypeScript, and Tailwind CSS.

It ships with authentication, charts, tables, forms, and a feature-based folder structure, so you can skip the boilerplate and start building. It works well as a base for SaaS apps, internal tools, and admin panels.

### Tech Stack

- Framework - [Next.js 16](https://nextjs.org/16)
- Language - [TypeScript](https://www.typescriptlang.org)
- Auth - [Clerk](https://go.clerk.com/ILdYhn7)
- Error tracking - [Sentry](https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy26q2-nextjs&utm_content=github-banner-project-tryfree)
- Styling - [Tailwind CSS v4](https://tailwindcss.com)
- Components - [shadcn/ui](https://ui.shadcn.com)
- Charts - [Recharts](https://recharts.org) • [Evil Charts](https://evilcharts.com/)
- Schema validation - [Zod](https://zod.dev)
- Data fetching - [TanStack React Query](https://tanstack.com/query)
- State management - [Zustand](https://zustand-demo.pmnd.rs)
- Search param state - [Nuqs](https://nuqs.47ng.com/)
- Tables - [TanStack Data Tables](https://ui.shadcn.com/docs/components/data-table) • [Dice Table](https://www.diceui.com/docs/components/data-table)
- Forms - [TanStack Form](https://tanstack.com/form) + [Zod](https://zod.dev)
- Command+K interface - [kbar](https://kbar.vercel.app/)
- Linter / Formatter - [OxLint](https://oxc.rs/docs/guide/usage/linter) • [Oxfmt](https://oxc.rs/docs/guide/usage/formatter)
- Pre-commit hooks - [Husky](https://typicode.github.io/husky/)
- Themes - [tweakcn](https://tweakcn.com/)

_Looking for a TanStack Start version? Here's the [repo](https://git.new/tanstack-start-dashboard)._

## Features

- Pre-built dashboard layout with sidebar, header, and content area
- Analytics overview page with cards and charts
- Data tables with React Query prefetch, client-side cache, search, filter, and pagination
- Authentication and user management through Clerk
- Multi-tenant workspaces using Clerk Organizations (create, switch, manage teams)
- Billing and subscriptions via Clerk Billing for B2B, with plan management and feature gating
- Client-side RBAC navigation that filters menu items by organization, permissions, and roles
- Infobar component for tips, status messages, or contextual notes on any page
- shadcn/ui components styled with Tailwind CSS
- Six-plus themes with a theme switcher
- Feature-based folder structure
- A starting point for SaaS dashboards, internal tools, and client admin panels

## Use Cases

A few things you can build with it:

- SaaS admin dashboards
- Internal tools and operations panels
- Analytics dashboards
- Client project admin panels
- A boilerplate for new Next.js shadcn projects

## Pages

| Page                                                                                                                                                                  | Notes                                                                                                                                                                                |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Signup / Signin](https://go.clerk.com/ILdYhn7)                                                                                                                       | Auth handled by Clerk, with passwordless sign-in, social logins, and enterprise SSO.                                                                                                |
| [Dashboard Overview](https://shadcn-dashboard.kiranism.dev/dashboard)                                                                                                 | Cards and Recharts graphs. Parallel routes give each section its own loading and error state.                                                                                       |
| [Product List (Table)](https://shadcn-dashboard.kiranism.dev/dashboard/product)                                                                                       | TanStack Table plus React Query (server prefetch, client cache) with nuqs URL state for search, filter, and pagination. `shallow: true` keeps interactions on the client.           |
| [Create Product Form](https://shadcn-dashboard.kiranism.dev/dashboard/product/new)                                                                                    | TanStack Form and Zod with `useMutation` for create and update. Cache is invalidated on success.                                                                                    |
| [Users (Table)](https://shadcn-dashboard.kiranism.dev/dashboard/users)                                                                                                | Same setup as Products: React Query with nuqs, server prefetch, and client-side pagination and filtering.                                                                           |
| [React Query Demo](https://shadcn-dashboard.kiranism.dev/dashboard/react-query)                                                                                       | A Pokemon API example showing the server prefetch, `HydrationBoundary`, and `useSuspenseQuery` pattern with client-side cache.                                                      |
| [Profile](https://shadcn-dashboard.kiranism.dev/dashboard/profile)                                                                                                   | Clerk's account management UI for profile and security settings.                                                                                                                    |
| [Kanban Board](https://shadcn-dashboard.kiranism.dev/dashboard/kanban)                                                                                                | Drag-and-drop task board built with dnd-kit and Zustand. Column sorting, priority badges, assignees, and due dates.                                                                 |
| [Chat](https://shadcn-dashboard.kiranism.dev/dashboard/chat)                                                                                                          | Messaging UI with a conversation list, message bubbles, quick replies, attachments, and an auto-reply demo. Multi-panel layout that works on mobile.                                |
| [Notifications](https://shadcn-dashboard.kiranism.dev/dashboard/notifications)                                                                                        | Notification center with a header badge, popover preview, and a full page with All / Unread / Read tabs. Includes mark-as-read and mark-all-as-read.                                |
| [Workspaces](https://shadcn-dashboard.kiranism.dev/dashboard/workspaces)                                                                                              | Organization management using Clerk's `<OrganizationList />`. View, create, and switch between organizations.                                                                       |
| [Team Management](https://shadcn-dashboard.kiranism.dev/dashboard/workspaces/team)                                                                                    | Team management using Clerk's `<OrganizationProfile />`. Manage members, roles, permissions, security, and org details. Needs an active organization.                               |
| [Billing & Plans](https://shadcn-dashboard.kiranism.dev/dashboard/billing)                                                                                            | Billing page using Clerk's `<PricingTable />`. View plans, subscribe, and manage subscriptions. Needs an active organization.                                                       |
| [Exclusive Page](https://shadcn-dashboard.kiranism.dev/dashboard/exclusive)                                                                                           | Plan-based access control with Clerk's `<Protect>`. Only available to organizations on the Pro plan, with a fallback UI for everyone else.                                          |
| [Not Found](https://shadcn-dashboard.kiranism.dev/dashboard/notfound)                                                                                                 | A root-level not-found page.                                                                                                                                                        |
| [Global Error](https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy26q2-nextjs&utm_content=github-banner-project-tryfree) | A shared error page wired to Sentry for logging, reports, and session replay.                                                                                                       |

## Folder Structure

```plaintext
src/
├── app/                           # Next.js App Router directory
│   ├── auth/                      # Auth pages (sign-in, sign-up)
│   ├── dashboard/                 # Dashboard route group
│   │   ├── overview/              # Analytics with parallel routes
│   │   ├── product/               # Product CRUD pages (React Query)
│   │   ├── users/                 # Users table (React Query + nuqs)
│   │   ├── react-query/           # React Query demo page
│   │   ├── kanban/                # Task board page
│   │   ├── chat/                  # Messaging page
│   │   ├── notifications/         # Notifications page
│   │   ├── workspaces/            # Org management & teams
│   │   ├── billing/               # Billing & plans
│   │   ├── profile/               # User profile
│   │   └── exclusive/             # Plan-gated page
│   └── api/                       # API routes
│
├── components/                    # Shared components
│   ├── ui/                        # UI primitives (buttons, inputs, kanban, etc.)
│   ├── layout/                    # Layout components (header, sidebar, etc.)
│   ├── themes/                    # Theme system (selector, mode toggle, config)
│   └── kbar/                      # Command+K interface
│
├── features/                      # Feature-based modules
│   ├── overview/                  # Dashboard analytics (charts, cards)
│   ├── products/                  # Product listing, form, tables (React Query)
│   ├── users/                     # User management table (React Query)
│   ├── react-query-demo/          # React Query demo (Pokemon API)
│   ├── kanban/                    # Drag-drop task board
│   ├── chat/                      # Messaging (conversations, bubbles, composer)
│   ├── notifications/             # Notification center & store
│   ├── auth/                      # Auth components
│   └── profile/                   # Profile form schemas
│
├── lib/                           # Core utilities (query-client, searchparams, etc.)
├── hooks/                         # Custom hooks
├── config/                        # Navigation, infobar, data table config
├── constants/                     # Mock data
├── styles/                        # Global CSS & theme files
│   └── themes/                    # Individual theme CSS files
└── types/                         # TypeScript types
```

## Getting Started

> [!NOTE]
> This starter uses Next.js 16 (App Router) with React 19 and shadcn/ui. To run it locally:

Clone the repo:

```
git clone https://github.com/Kiranism/next-shadcn-dashboard-starter.git
```

- `bun install`
- Copy the example env file: `cp env.example.txt .env.local`
- Fill in the required variables in `.env.local`
- `bun run dev`

##### Environment variables

See `env.example.txt` for the variables you need. They cover authentication and error tracking.

##### Clerk setup

For setting up Clerk auth (including organizations, workspaces, and teams), see [clerk_setup.md](./docs/clerk_setup.md).

The app should now be running at http://localhost:3000.

> [!WARNING]
> After cloning or forking, be careful when pulling the latest changes. Updates can cause merge conflicts.

---

#### Cleanup

To strip out features you don't need (auth, kanban, chat, notifications, extra themes, Sentry), run the cleanup script:

```bash
node scripts/cleanup.js --interactive   # interactive mode
node scripts/cleanup.js --list          # see available features
node scripts/cleanup.js --dry-run chat  # preview before removing
node scripts/cleanup.js kanban chat     # remove specific features
```

Run `node scripts/cleanup.js --help` for all options. Delete `scripts/cleanup.js` when you're done.

## Deploy

The project includes Dockerfiles (`Dockerfile` for Node.js, `Dockerfile.bun` for Bun) that use standalone output mode. For other options, see the [Next.js deployment docs](https://nextjs.org/docs/app/getting-started/deploying).

### Docker

Build the image:

```bash
# Node.js
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx \
  -t shadcn-dashboard .

# OR Bun
docker build -f Dockerfile.bun \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx \
  -t shadcn-dashboard .
```

Run the container:

```bash
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx \
  -e CLERK_SECRET_KEY=sk_live_xxxxx \
  --restart unless-stopped \
  --name shadcn-dashboard \
  shadcn-dashboard
```

### Support

If this template saved you some time, a star is appreciated. You can also [buy me a coffee](https://buymeacoffee.com/kir4n) if you'd like.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow?style=flat-square&logo=buymeacoffee)](https://buymeacoffee.com/kir4n)

<!--

SEO keywords:

open source admin dashboard, nextjs admin dashboard, nextjs dashboard template,

shadcn ui dashboard, admin dashboard starter, next.js 16, typescript dashboard,

dashboard ui template, nextjs shadcn admin panel, react admin dashboard,

tailwind css admin dashboard

-->

---

## Star History

<a href="https://www.star-history.com/#Kiranism/next-shadcn-dashboard-starter&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Kiranism/next-shadcn-dashboard-starter&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Kiranism/next-shadcn-dashboard-starter&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Kiranism/next-shadcn-dashboard-starter&type=date&legend=top-left" />
 </picture>
</a>
