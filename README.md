<p align="center">
<h1 align="center">Sistema Webconsig - Gestão de Consignações</h1>

<div align="center">Sistema completo de gestão de empréstimos consignados - Built with Next.js 16, Prisma & Shadcn UI</div>

<br />

## 📋 Overview

Este projeto migrou o backend Flask do [webconsig_v2](https://github.com/josecarlosdvf/webconsig_v2) para uma aplicação **Next.js full-stack**, mantendo todo o frontend moderno com **Shadcn UI**.

Sistema completo para gestão de:
- 👥 **Clientes** - Cadastro completo com CPF, telefones, endereços, dados bancários
- 📄 **Propostas** - Workflow de empréstimos consignados com 18 status diferentes
- 📊 **Kanban** - Quadro visual para acompanhamento de propostas
- 🔐 **Autenticação** - Sistema robusto com JWT e controle de permissões (RBAC)

### 🚀 Tech Stack

**Backend:**
- Framework - [Next.js 16 API Routes](https://nextjs.org/16)
- Database - [Prisma ORM](https://www.prisma.io) + PostgreSQL (ou SQL Server)
- Auth - JWT com bcrypt
- Language - [TypeScript](https://www.typescriptlang.org)

**Frontend:**
- Framework - [Next.js 16](https://nextjs.org/16) App Router
- Styling - [Tailwind CSS v4](https://tailwindcss.com)
- Components - [Shadcn-ui](https://ui.shadcn.com)
- State Management - [Zustand](https://zustand-demo.pmnd.rs)
- Forms - [React Hook Form](https://ui.shadcn.com/docs/components/form) + [Zod](https://zod.dev)
- Tables - [Tanstack Data Tables](https://ui.shadcn.com/docs/components/data-table)
- Drag & Drop - [@dnd-kit](https://dndkit.com/)

**DevTools:**
- Linting - [ESLint](https://eslint.org)
- Formatting - [Prettier](https://prettier.io)
- Pre-commit - [Husky](https://typicode.github.io/husky/)

## ✨ Features

- 👥 **Gestão Completa de Clientes** - Cadastro com CPF, telefones, endereços, identidade, dados bancários
- 📄 **Workflow de Propostas** - 18 status diferentes para empréstimos consignados
- 📊 **Kanban Board** - Drag & Drop para visualização e organização de propostas
- 🔐 **Autenticação JWT** - Sistema seguro com cookies HTTP-only
- 🛡️ **RBAC** - Controle de acesso baseado em roles e permissões
- 📋 **API RESTful** - Endpoints para todos os recursos
- 🎨 **UI Moderna** - Interface responsiva e acessível

- 🔐 **Authentication** & user management via Clerk

- 🧩 **Shadcn UI components** with Tailwind CSS styling

- 🧠 Feature-based folder structure for scalable projects

- ⚙️ Ready for **SaaS dashboards**, internal tools, and client admin panels

## Use Cases

You can use this Next.js + Shadcn UI dashboard starter to build:

- SaaS admin dashboards

- Internal tools & operations panels

- Analytics dashboards

- Client project admin panels

- Boilerplate for new Next.js admin UI projects

## Pages

| Pages                                                                                                                                                                  | Specifications                                                                                                                                                                                                                                                          |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Signup / Signin](https://go.clerk.com/ILdYhn7)                                                                                                                        | Authentication with **Clerk** provides secure authentication and user management with multiple sign-in options including passwordless authentication, social logins, and enterprise SSO - all designed to enhance security while delivering a seamless user experience. |
| [Dashboard Overview](https://shadcn-dashboard.kiranism.dev/dashboard)                                                                                                  | Cards with Recharts graphs for analytics. Parallel routes in the overview sections feature independent loading, error handling, and isolated component rendering.                                                                                                       |
| [Product List (Table)](https://shadcn-dashboard.kiranism.dev/dashboard/product)                                                                                        | Tanstack tables with server side searching, filter, pagination by Nuqs which is a Type-safe search params state manager in nextjs                                                                                                                                       |
| [Create Product Form](https://shadcn-dashboard.kiranism.dev/dashboard/product/new)                                                                                     | A Product Form with shadcn form (react-hook-form + zod).                                                                                                                                                                                                                |
| [Profile](https://shadcn-dashboard.kiranism.dev/dashboard/profile)                                                                                                     | Clerk's full-featured account management UI that allows users to manage their profile and security settings                                                                                                                                                             |
| [Kanban Board](https://shadcn-dashboard.kiranism.dev/dashboard/kanban)                                                                                                 | A Drag n Drop task management board with dnd-kit and zustand to persist state locally.                                                                                                                                                                                  |
| [Not Found](https://shadcn-dashboard.kiranism.dev/dashboard/notfound)                                                                                                  | Not Found Page Added in the root level                                                                                                                                                                                                                                  |
| [Global Error](https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy26q2-nextjs&utm_content=github-banner-project-tryfree) | A centralized error page that captures and displays errors across the application. Integrated with **Sentry** to log errors, provide detailed reports, and enable replay functionality for better debugging.                                                            |

## Feature based organization

```plaintext
src/
├── app/ # Next.js App Router directory
│ ├── (auth)/ # Auth route group
│ │ ├── (signin)/
│ ├── (dashboard)/ # Dashboard route group
│ │ ├── layout.tsx
│ │ ├── loading.tsx
│ │ └── page.tsx
│ └── api/ # API routes
│
├── components/ # Shared components
│ ├── ui/ # UI components (buttons, inputs, etc.)
│ └── layout/ # Layout components (header, sidebar, etc.)
│
├── features/ # Feature-based modules
│ ├── feature/
│ │ ├── components/ # Feature-specific components
│ │ ├── actions/ # Server actions
│ │ ├── schemas/ # Form validation schemas
│ │ └── utils/ # Feature-specific utilities
│ │
├── lib/ # Core utilities and configurations
│ ├── auth/ # Auth configuration
│ ├── db/ # Database utilities
│ └── utils/ # Shared utilities
│
├── hooks/ # Custom hooks
│ └── use-debounce.ts
│
├── stores/ # Zustand stores
│ └── dashboard-store.ts
│
└── types/ # TypeScript types
└── index.ts
```

## Getting Started

> [!NOTE]  
> This admin dashboard starter uses **Next.js 16 (App Router)** with **React 19** and **Shadcn UI**. Follow these steps to run it locally:

Clone the repo:

```
git clone https://github.com/Kiranism/next-shadcn-dashboard-starter.git
```

- `bun install`
- Create a `.env.local` file by copying the example environment file:
  `cp env.example.txt .env.local`
- Add the required environment variables to the `.env.local` file.
- `bun run dev`

##### Environment Configuration Setup

To configure the environment for this project, refer to the `env.example.txt` file. This file contains the necessary environment variables required for authentication and error tracking.

You should now be able to access the application at http://localhost:3000.

> [!WARNING]
> After cloning or forking the repository, be cautious when pulling or syncing with the latest changes, as this may result in breaking conflicts.

Cheers! 🥂

<!--

SEO keywords:

nextjs admin dashboard, nextjs dashboard template, shadcn ui dashboard,

admin dashboard starter, dashboard ui template, nextjs shadcn admin panel,

react admin dashboard, tailwind css admin dashboard

-->

## Star History

<a href="https://www.star-history.com/#Kiranism/next-shadcn-dashboard-starter&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Kiranism/next-shadcn-dashboard-starter&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Kiranism/next-shadcn-dashboard-starter&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Kiranism/next-shadcn-dashboard-starter&type=date&legend=top-left" />
 </picture>
</a>
