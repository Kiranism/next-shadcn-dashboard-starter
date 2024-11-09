<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/9113740/201498864-2a900c64-d88f-4ed4-b5cf-770bcb57e1f5.png">
  <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/9113740/201498152-b171abb8-9225-487a-821c-6ff49ee48579.png">
</picture>

<div align="center"><strong>Next.js 14 Admin Dashboard Starter Template With Shadcn-ui</strong></div>
<div align="center">Built with the Next.js App Router</div>
<br />
<div align="center">
<a href="https://next-shadcn-dashboard-starter.vercel.app">View Demo</a>
<span>
</div>

## Overview

This is a starter template using the following stack:

- Framework - [Next.js 14](https://nextjs.org/13)
- Language - [TypeScript](https://www.typescriptlang.org)
- Styling - [Tailwind CSS](https://tailwindcss.com)
- Components - [Shadcn-ui](https://ui.shadcn.com)
- Schema Validations - [Zod](https://zod.dev)
- State Management - [Zustand](https://zustand-demo.pmnd.rs)
- Search params state manager - [Nuqs](https://nuqs.47ng.com/)
- Auth - [Auth.js](https://authjs.dev/)
- Tables - [Tanstack Tables](https://ui.shadcn.com/docs/components/data-table)
- Forms - [React Hook Form](https://ui.shadcn.com/docs/components/form)
- Command+k interface - [kbar](https://kbar.vercel.app/)
- Linting - [ESLint](https://eslint.org)
- Pre-commit Hooks - [Husky](https://typicode.github.io/husky/)
- Formatting - [Prettier](https://prettier.io)

_If you are looking for a React admin dashboard starter, here is the [repo](https://github.com/Kiranism/react-shadcn-dashboard-starter)._

## Pages

| Pages                                                                                   | Specifications                                                                                                                      |
| :-------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| [Signup](https://next-shadcn-dashboard-starter.vercel.app/)                             | Authentication with **NextAuth** supports Social logins and email logins (Enter dummy email for demo).                              |
| [Dashboard](https://next-shadcn-dashboard-starter.vercel.app/dashboard)                 | Cards with recharts graphs for analytics.                                                                                           |
| [Employee](https://next-shadcn-dashboard-starter.vercel.app/dashboard/employee)         | Tanstack tables with server side searching, filter, pagination by Nuqs which is a Type-safe search params state manager in nextjs). |
| [Employee/new](https://next-shadcn-dashboard-starter.vercel.app/dashboard/employee/new) | A Employee Form with shadcn form (react-hook-form + zod).                                                                           |
| [Product](https://next-shadcn-dashboard-starter.vercel.app/dashboard/product)           | Tanstack tables with server side searching, filter, pagination by Nuqs which is a Type-safe search params state manager in nextjs   |
| [Product/new](https://next-shadcn-dashboard-starter.vercel.app/dashboard/product/new)   | A Product Form with shadcn form (react-hook-form + zod).                                                                            |
| [Profile](https://next-shadcn-dashboard-starter.vercel.app/dashboard/profile)           | Mutistep dynamic forms using react-hook-form and zod for form validation.                                                           |
| [Kanban Board](https://next-shadcn-dashboard-starter.vercel.app/dashboard/kanban)       | A Drag n Drop task management board with dnd-kit and zustand to persist state locally.                                              |
| [Not Found](https://next-shadcn-dashboard-starter.vercel.app/dashboard/notfound)        | Not Found Page Added in the root level                                                                                              |
| -                                                                                       | -                                                                                                                                   |

## Getting Started

Follow these steps to clone the repository and start the development server:

- `git clone https://github.com/Kiranism/next-shadcn-dashboard-starter.git`
- `npm install`
- Create a `.env.local` file by copying the example environment file:
  `cp env.example.txt .env.local`
- Add the required environment variables to the `.env.local` file.
- `npm run dev`

You should now be able to access the application at http://localhost:3000.

> [!WARNING]  
> After cloning or forking the repository, be cautious when pulling or syncing with the latest changes, as this may result in breaking conflicts.

Cheers! 🥂
