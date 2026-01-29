/**
 * Feature-based cleanup configuration.
 * Each feature key defines what to remove when running: node scripts/cleanup.js <feature>
 */
module.exports = {
  features: {
    clerk: {
      name: 'Clerk (Authentication, Organizations, Billing)',
      folders: [
        'src/app/auth',
        'src/app/dashboard/workspaces',
        'src/app/dashboard/billing',
        'src/app/dashboard/profile',
        'src/app/dashboard/exclusive',
        'src/features/auth',
        'src/features/profile'
      ],
      files: ['docs/clerk_setup.md', 'src/middleware.ts', 'middleware.ts'],
      imports: [
        '@clerk/nextjs',
        '@clerk/themes',
        '@/components/org-switcher',
        '@/features/auth/components/sign-in-view',
        '@/features/auth/components/sign-up-view',
        '@/features/profile/components/profile-view-page'
      ],
      dependencies: ['@clerk/nextjs', '@clerk/themes'],
      envVars: [
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        'CLERK_SECRET_KEY',
        'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
        'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
        'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
        'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
        'WEBHOOK_SECRET'
      ],
      cleanNextConfig: true,
      navItemsToRemove: [
        '/dashboard/workspaces',
        '/dashboard/workspaces/team',
        '/dashboard/billing',
        '/dashboard/profile',
        '/dashboard/exclusive'
      ],
      templateDir: '__CLEANUP__/clerk',
      templateFiles: {
        'src/components/layout/providers.tsx': 'providers.tsx',
        'src/components/layout/app-sidebar.tsx': 'app-sidebar.tsx',
        'src/components/layout/user-nav.tsx': 'user-nav.tsx',
        'src/hooks/use-nav.ts': 'use-nav.ts',
        'src/app/page.tsx': 'app-page.tsx',
        'src/app/dashboard/page.tsx': 'dashboard-page.tsx',
        'src/config/infoconfig.ts': 'infoconfig.ts'
      },
      replacements: {
        'src/proxy.ts': `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};
`
      }
    },
    kanban: {
      name: 'Kanban (Drag n Drop board)',
      folders: ['src/app/dashboard/kanban', 'src/features/kanban'],
      files: [],
      dependencies: [
        '@dnd-kit/core',
        '@dnd-kit/modifiers',
        '@dnd-kit/sortable',
        '@dnd-kit/utilities',
        'zustand'
      ],
      navItemsToRemove: ['/dashboard/kanban'],
      templateDir: '__CLEANUP__/kanban',
      templateFiles: {
        'src/config/nav-config.ts': 'nav-config.ts'
      }
    },
    sentry: {
      name: 'Sentry (Error tracking)',
      folders: [],
      files: ['src/instrumentation.ts', 'src/instrumentation-client.ts'],
      dependencies: ['@sentry/nextjs'],
      envVars: [
        'NEXT_PUBLIC_SENTRY_DSN',
        'NEXT_PUBLIC_SENTRY_ORG',
        'NEXT_PUBLIC_SENTRY_PROJECT',
        'SENTRY_AUTH_TOKEN',
        'NEXT_PUBLIC_SENTRY_DISABLED'
      ],
      templateDir: '__CLEANUP__/sentry',
      templateFiles: {
        'next.config.ts': 'next.config.ts',
        'src/app/global-error.tsx': 'global-error.tsx',
        'src/app/dashboard/overview/@bar_stats/error.tsx': 'bar_stats-error.tsx'
      }
    }
  }
};
