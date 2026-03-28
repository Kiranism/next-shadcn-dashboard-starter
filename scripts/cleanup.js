#!/usr/bin/env node

/**
 * Feature Cleanup Tool
 *
 * Strips optional features from the dashboard starter.
 * Run: node scripts/cleanup.js --help
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

// ─── Templates (inline) ────────────────────────────────────────────

const TEMPLATES = {
  clerk: {
    'src/app/page.tsx': `import { redirect } from 'next/navigation';

export default async function Page() {
  redirect('/dashboard/overview');
}
`,
    'src/app/dashboard/page.tsx': `import { redirect } from 'next/navigation';

export default async function Dashboard() {
  redirect('/dashboard/overview');
}
`,
    'src/components/layout/providers.tsx': `'use client';
import React from 'react';
import { ActiveThemeProvider } from '../themes/active-theme';
import QueryProvider from './query-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <QueryProvider>{children}</QueryProvider>
      </ActiveThemeProvider>
    </>
  );
}
`,
    'src/components/layout/app-sidebar.tsx': `'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { navGroups } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const filteredGroups = useFilteredNavGroups(navGroups);

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader />
      <SidebarContent className='overflow-x-hidden'>
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label || 'ungrouped'} className='py-0'>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url}>
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                          <Icons.chevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <span className='truncate'>Account</span>
                  <Icons.chevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='text-muted-foreground px-1 py-1.5 text-sm'>
                    Sign in to manage your account
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Icons.notification className='mr-2 h-4 w-4' />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
`,
    'src/components/layout/user-nav.tsx': `'use client';

export function UserNav() {
  return null;
}
`,
    'src/hooks/use-nav.ts': `'use client';

import type { NavItem, NavGroup } from '@/types';

export function useFilteredNavItems(items: NavItem[]) {
  return items;
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  return groups;
}
`,
    'src/config/infoconfig.ts': `import type { InfobarContent } from '@/components/ui/infobar';

export const productInfoContent: InfobarContent = {
  title: 'Product Management',
  sections: [
    {
      title: 'Overview',
      description:
        'The Products page allows you to manage your product catalog. You can view all products in a table format with server-side functionality including sorting, filtering, pagination, and search capabilities. Use the "Add New" button to create new products.',
      links: [
        {
          title: 'Product Management Guide',
          url: '#'
        }
      ]
    },
    {
      title: 'Adding Products',
      description:
        'To add a new product, click the "Add New" button in the page header. You will be taken to a form where you can enter product details including name, description, price, category, and upload product images.',
      links: [
        {
          title: 'Adding Products Documentation',
          url: '#'
        }
      ]
    },
    {
      title: 'Editing Products',
      description:
        'You can edit existing products by clicking on a product row in the table. This will open the product edit form where you can modify any product information. Changes are saved automatically when you submit the form.',
      links: [
        {
          title: 'Editing Products Guide',
          url: '#'
        }
      ]
    },
    {
      title: 'Deleting Products',
      description:
        'Products can be deleted from the product listing table. Click the delete action for the product you want to remove. You will be asked to confirm the deletion before the product is permanently removed from your catalog.',
      links: [
        {
          title: 'Product Deletion Policy',
          url: '#'
        }
      ]
    },
    {
      title: 'Table Features',
      description:
        'The product table includes several powerful features to help you manage large product catalogs efficiently. You can sort columns by clicking on column headers, filter products using the filter controls, navigate through pages using pagination, and quickly find products using the search functionality.',
      links: [
        {
          title: 'Table Features Documentation',
          url: '#'
        },
        {
          title: 'Sorting and Filtering Guide',
          url: '#'
        }
      ]
    },
    {
      title: 'Product Fields',
      description:
        'Each product can have the following fields: Name (required), Description (optional text), Price (numeric value), Category (for organizing products), and Image Upload (for product photos). All fields can be edited when creating or updating a product.',
      links: [
        {
          title: 'Product Fields Specification',
          url: '#'
        }
      ]
    }
  ]
};
`
  },
  sentry: {
    'next.config.ts': `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'clerk.com',
        port: ''
      }
    ]
  },
  transpilePackages: ['geist'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

export default nextConfig;
`,
    'src/app/global-error.tsx': `'use client';

import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang='en'>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
`,
    'src/app/dashboard/overview/@bar_stats/error.tsx': `'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';

interface StatsErrorProps {
  error: Error;
  reset: () => void;
}
export default function StatsError({ error, reset }: StatsErrorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const reload = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };
  return (
    <Card className='border-red-500'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <Alert variant='destructive' className='border-none'>
            <Icons.alertCircle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className='mt-2'>
              Failed to load statistics: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </CardHeader>
      <CardContent className='flex h-[316px] items-center justify-center p-6'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-4 text-sm'>
            Unable to display statistics at this time
          </p>
          <Button
            onClick={() => reload()}
            variant='outline'
            className='min-w-[120px]'
            disabled={isPending}
          >
            Try again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
`
  }
};

// ─── Feature Configuration ──────────────────────────────────────────

const FEATURES = {
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
    files: [
      'docs/clerk_setup.md',
      'src/components/org-switcher.tsx',
      'src/components/user-avatar-profile.tsx'
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
    templates: TEMPLATES.clerk,
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
    name: 'Kanban (Drag & Drop task board)',
    folders: ['src/app/dashboard/kanban', 'src/features/kanban'],
    files: ['src/components/ui/kanban.tsx'],
    dependencies: [
      '@dnd-kit/core',
      '@dnd-kit/modifiers',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities'
    ],
    navItemsToRemove: ['/dashboard/kanban']
  },
  chat: {
    name: 'Chat (Messaging UI)',
    folders: ['src/app/dashboard/chat', 'src/features/chat'],
    files: ['src/components/ui/file-preview.tsx'],
    dependencies: [],
    navItemsToRemove: ['/dashboard/chat']
  },
  notifications: {
    name: 'Notifications (Notification center & page)',
    folders: ['src/app/dashboard/notifications', 'src/features/notifications'],
    files: ['src/components/ui/notification-card.tsx'],
    dependencies: [],
    navItemsToRemove: ['/dashboard/notifications']
  },
  examples: {
    name: 'Examples (Forms, React Query demo, Icons)',
    folders: [
      'src/app/dashboard/forms',
      'src/app/dashboard/elements',
      'src/app/dashboard/react-query',
      'src/features/forms',
      'src/features/elements',
      'src/features/react-query-demo'
    ],
    files: [],
    dependencies: [],
    navItemsToRemove: [
      '/dashboard/forms/basic',
      '/dashboard/forms/multi-step',
      '/dashboard/forms/sheet-form',
      '/dashboard/forms/advanced',
      '/dashboard/react-query',
      '/dashboard/elements/icons'
    ]
  },
  themes: {
    name: 'Extra Themes (keep only one theme)',
    custom: true
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
    templates: TEMPLATES.sentry
  }
};

// ─── Safety Check ───────────────────────────────────────────────────

function checkGitSafe() {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (_) {
    return {
      safe: false,
      message:
        'No git repository found. Initialize with "git init" and make at least one commit so you can revert (e.g. git restore .) if you run cleanup by mistake.'
    };
  }
  try {
    execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (_) {
    return {
      safe: false,
      message:
        'No commits yet. Make an initial commit so you can revert (e.g. git restore .) if you run cleanup by mistake.'
    };
  }
  return { safe: true };
}

// ─── Cleanup Engine ─────────────────────────────────────────────────

class FeatureCleanup {
  constructor(features, options = {}) {
    this.featuresToRemove = Array.isArray(features) ? features : [features];
    this.force = options.force === true;
    this.dryRun = options.dryRun === true;
    this.keepTheme = options.keepTheme || null;
  }

  log(msg) {
    console.log(this.dryRun ? `  [dry-run] ${msg}` : `  ${msg}`);
  }

  async cleanup() {
    if (!this.force) {
      const { safe, message } = checkGitSafe();
      if (!safe) {
        console.error('\n⚠️  Safety check failed:\n');
        console.error(`   ${message}\n`);
        console.error('   Run with --force to run anyway (not recommended).\n');
        process.exit(1);
      }
    }

    console.log(
      this.dryRun
        ? '🔍 Dry run mode — showing what would be changed (no files modified)\n'
        : '🧹 Starting feature cleanup...\n'
    );

    const allNavItemsToRemove = [];

    for (const featureName of this.featuresToRemove) {
      const feature = FEATURES[featureName];
      if (!feature) {
        console.log(`⚠️  Unknown feature: ${featureName}`);
        continue;
      }

      console.log(`\n📦 Removing ${feature.name}...`);

      if (feature.custom && featureName === 'themes') {
        await this.cleanThemes();
        continue;
      }

      this.deleteFolders(feature);
      this.deleteFiles(feature);
      this.writeTemplates(feature);
      this.writeReplacements(feature);
      this.cleanDependencies(feature);
      this.cleanEnvVars(feature);
      if (feature.cleanNextConfig) this.cleanNextConfig();
      if (feature.navItemsToRemove?.length) {
        allNavItemsToRemove.push(...feature.navItemsToRemove);
      }
      this.cleanDocReferences(feature);
    }

    if (allNavItemsToRemove.length > 0) {
      this.cleanNavConfig(allNavItemsToRemove);
    }

    if (this.featuresToRemove.includes('notifications')) {
      this.cleanNotificationFromHeader();
      this.cleanNotificationFromSidebar();
    }

    if (this.dryRun) {
      console.log('\n🔍 Dry run complete — no files were modified.\n');
    } else {
      console.log('\n✨ Cleanup complete!\n');
      console.log('📋 Next steps:');
      console.log('  1. Run: bun install (or npm install) to sync dependencies');
      console.log('  2. Review and test your application');
      console.log('  3. To revert: git restore . (or git checkout .)');
      console.log('  4. Delete scripts/cleanup.js if no longer needed\n');
    }
  }

  // ── File operations ───────────────────────────────────────────────

  deleteFolders(feature) {
    if (!feature.folders) return;
    for (const folder of feature.folders) {
      const fullPath = path.join(ROOT, folder);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        if (!this.dryRun) fs.rmSync(fullPath, { recursive: true, force: true });
        this.log(`✅ Deleted folder: ${folder}`);
      }
    }
  }

  deleteFiles(feature) {
    if (!feature.files?.length) return;
    for (const file of feature.files) {
      const fullPath = path.join(ROOT, file);
      if (fs.existsSync(fullPath)) {
        if (!this.dryRun) fs.rmSync(fullPath, { force: true });
        this.log(`✅ Deleted file: ${file}`);
      }
    }
  }

  writeTemplates(feature) {
    if (!feature.templates) return;
    for (const [destPath, content] of Object.entries(feature.templates)) {
      if (!this.dryRun) {
        const fullPath = path.join(ROOT, destPath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, content, 'utf8');
      }
      this.log(`✅ Wrote: ${destPath}`);
    }
  }

  writeReplacements(feature) {
    if (!feature.replacements) return;
    for (const [filePath, content] of Object.entries(feature.replacements)) {
      if (!this.dryRun) {
        const fullPath = path.join(ROOT, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, content.trimEnd() + '\n', 'utf8');
      }
      this.log(`✅ Wrote: ${filePath}`);
    }
  }

  cleanDependencies(feature) {
    if (!feature.dependencies?.length) return;
    const pkgPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let removed = 0;

    for (const dep of feature.dependencies) {
      if (pkg.dependencies?.[dep]) {
        if (!this.dryRun) delete pkg.dependencies[dep];
        removed++;
      }
      if (pkg.devDependencies?.[dep]) {
        if (!this.dryRun) delete pkg.devDependencies[dep];
        removed++;
      }
    }

    if (removed > 0) {
      if (!this.dryRun) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      }
      this.log(`✅ Removed ${removed} dependencies`);
    }
  }

  cleanEnvVars(feature) {
    if (!feature.envVars?.length) return;
    const envFiles = ['.env.local', '.env.example', '.env', 'env.example.txt'];

    for (const envFile of envFiles) {
      const envPath = path.join(ROOT, envFile);
      if (!fs.existsSync(envPath)) continue;

      let content = fs.readFileSync(envPath, 'utf8');
      let modified = false;

      for (const envVar of feature.envVars) {
        const regex = new RegExp(`(#.*\\n)?^${envVar}=.*$`, 'gm');
        if (regex.test(content)) {
          content = content.replace(regex, '');
          modified = true;
        }
      }

      if (modified) {
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        if (!this.dryRun) fs.writeFileSync(envPath, content, 'utf8');
        this.log(`✅ Cleaned ${envFile}`);
      }
    }
  }

  cleanNextConfig() {
    const configPath = path.join(ROOT, 'next.config.ts');
    if (!fs.existsSync(configPath)) return;

    let content = fs.readFileSync(configPath, 'utf8');
    const before = content;
    // Remove Clerk image hostname entries (handles both comma-first and comma-after patterns)
    content = content.replace(
      /,?\s*\{\s*protocol:\s*['"]https['"],\s*hostname:\s*['"]img\.clerk\.com['"][^}]*\},?/g,
      ''
    );
    content = content.replace(
      /,?\s*\{\s*protocol:\s*['"]https['"],\s*hostname:\s*['"]clerk\.com['"][^}]*\},?/g,
      ''
    );
    // Clean up any trailing comma before closing bracket
    content = content.replace(/,(\s*\])/g, '$1');
    if (content !== before) {
      if (!this.dryRun) fs.writeFileSync(configPath, content, 'utf8');
      this.log('✅ Cleaned next.config.ts (removed Clerk image hostnames)');
    }
  }

  cleanNavConfig(navItemsToRemove) {
    const navPath = path.join(ROOT, 'src/config/nav-config.ts');
    if (!fs.existsSync(navPath)) return;

    let content = fs.readFileSync(navPath, 'utf8');
    let modified = false;

    for (const url of navItemsToRemove) {
      // Find each object containing the url and remove it using brace-depth tracking
      // This handles nested braces (e.g. access: { requireOrg: true }) and trailing comments
      let idx;
      while ((idx = content.indexOf(`'${url}'`)) !== -1) {
        // Walk backwards to find the opening brace of this object
        let start = idx;
        let depth = 0;
        while (start > 0) {
          start--;
          if (content[start] === '}') depth++;
          if (content[start] === '{') {
            if (depth === 0) break;
            depth--;
          }
        }
        // Include leading whitespace/newline
        while (
          start > 0 &&
          (content[start - 1] === ' ' || content[start - 1] === '\t' || content[start - 1] === '\n')
        ) {
          start--;
        }

        // Walk forward from the url to find the matching closing brace
        let end = idx;
        depth = 0;
        while (end < content.length) {
          if (content[end] === '{') depth++;
          if (content[end] === '}') {
            depth--;
            if (depth < 0) {
              end++;
              break;
            }
          }
          end++;
        }
        // Skip trailing comma and whitespace
        if (content[end] === ',') end++;

        content = content.slice(0, start) + content.slice(end);
        modified = true;
      }
    }

    // Clean up empty parent groups (items array with only whitespace)
    content = content.replace(/,?\s*\{[^{}]*items:\s*\[\s*\]\s*\}/g, (match, offset) => {
      // Only remove if it looks like a parent group (has url: '#')
      return match.includes("url: '#'") ? '' : match;
    });

    // Clean up empty label groups with no items left
    content = content.replace(
      /,?\s*\{\s*label:\s*['"][^'"]*['"],\s*items:\s*\[\s*\]\s*\}/g,
      ''
    );

    content = content.replace(/,(\s*\])/g, '$1');
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (modified) {
      if (!this.dryRun) fs.writeFileSync(navPath, content, 'utf8');
      this.log(`✅ Cleaned nav-config.ts (removed ${navItemsToRemove.length} items)`);
    }
  }

  cleanNotificationFromHeader() {
    const headerPath = path.join(ROOT, 'src/components/layout/header.tsx');
    if (!fs.existsSync(headerPath)) return;

    let content = fs.readFileSync(headerPath, 'utf8');
    const before = content;

    content = content.replace(/import\s*\{[^}]*NotificationCenter[^}]*\}[^;]*;\n?/g, '');
    content = content.replace(/\s*<NotificationCenter\s*\/>\n?/g, '');

    if (content !== before) {
      if (!this.dryRun) fs.writeFileSync(headerPath, content, 'utf8');
      this.log('✅ Cleaned header.tsx (removed NotificationCenter)');
    }
  }

  cleanNotificationFromSidebar() {
    const sidebarPath = path.join(ROOT, 'src/components/layout/app-sidebar.tsx');
    if (!fs.existsSync(sidebarPath)) return;

    let content = fs.readFileSync(sidebarPath, 'utf8');
    const before = content;

    // Remove the Notifications dropdown menu item from the sidebar footer
    content = content.replace(
      /\s*<DropdownMenuItem[^>]*onClick=\{[^}]*\/dashboard\/notifications[^}]*\}[^>]*>\s*(?:<[^>]+>\s*)?Notifications\s*<\/DropdownMenuItem>/g,
      ''
    );

    if (content !== before) {
      if (!this.dryRun) fs.writeFileSync(sidebarPath, content, 'utf8');
      this.log('✅ Cleaned app-sidebar.tsx (removed Notifications menu item)');
    }
  }

  cleanDocReferences(feature) {
    if (!feature.name.toLowerCase().includes('clerk')) return;

    const docFiles = [
      path.join(ROOT, 'README.md'),
      path.join(ROOT, 'docs/nav-rbac.md'),
      path.join(ROOT, 'src/config/infoconfig.ts')
    ];

    for (const filePath of docFiles) {
      if (!fs.existsSync(filePath)) continue;
      let content = fs.readFileSync(filePath, 'utf8');
      const before = content;
      content = content.replace(/\n*# Clerk Setup Guide[\s\S]*?(?=\n#|\n##|$)/gi, '\n');
      content = content.replace(/Clerk['\s]/gi, 'Auth ');
      content = content.replace(/clerk\.com[^\s]*/gi, '');
      if (content !== before) {
        if (!this.dryRun) {
          fs.writeFileSync(filePath, content.replace(/\n\s*\n\s*\n/g, '\n\n'), 'utf8');
        }
        this.log(`✅ Cleaned doc references: ${path.relative(ROOT, filePath)}`);
      }
    }
  }

  // ── Dynamic theme cleanup ─────────────────────────────────────────

  async cleanThemes() {
    const themesDir = path.join(ROOT, 'src/styles/themes');
    if (!fs.existsSync(themesDir)) return;

    const themeFiles = fs.readdirSync(themesDir).filter((f) => f.endsWith('.css'));
    const themes = themeFiles.map((f) => ({
      file: f,
      value: f.replace('.css', ''),
      name: f
        .replace('.css', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    }));

    if (themes.length <= 1) {
      this.log('Only one theme found, nothing to clean.');
      return;
    }

    if (this.dryRun) {
      this.log(`Found ${themes.length} themes: ${themes.map((t) => t.value).join(', ')}`);
      this.log('Would prompt user to pick one theme to keep and remove the rest.');
      return;
    }

    // Use pre-set theme (for --all) or prompt
    let keepValue = this.keepTheme;

    if (!keepValue) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      const question = (q) => new Promise((resolve) => rl.question(q, resolve));

      console.log('\n  Available themes:\n');
      themes.forEach((t, i) => {
        console.log(`    ${i + 1}. ${t.name} (${t.value})`);
      });

      const answer = await question(
        `\n  Which theme to keep? (1-${themes.length}, default: vercel) `
      );
      rl.close();

      const index = parseInt(answer, 10) - 1;
      const selected = themes[index] || themes.find((t) => t.value === 'vercel') || themes[0];
      keepValue = selected.value;
    }

    const keep = themes.find((t) => t.value === keepValue) || themes[0];
    const toRemove = themes.filter((t) => t.value !== keep.value);

    this.log(`Keeping: ${keep.name} (${keep.value})`);

    // Delete other theme CSS files
    for (const theme of toRemove) {
      const filePath = path.join(themesDir, theme.file);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
        this.log(`✅ Deleted: src/styles/themes/${theme.file}`);
      }
    }

    // Rewrite theme.css
    const themeCssPath = path.join(ROOT, 'src/styles/theme.css');
    if (fs.existsSync(themeCssPath)) {
      fs.writeFileSync(
        themeCssPath,
        `/* Import individual theme files */
@import './themes/${keep.file}';

body {
  @apply overscroll-none;
}

:root {
  --header-height: calc(var(--spacing, 0.25rem) * 12 + 1px);
}

[data-theme] body {
  --font-sans: initial;
  --font-mono: initial;
  --font-serif: initial;
  font-family: var(--font-sans);
}
`,
        'utf8'
      );
      this.log('✅ Rewrote: src/styles/theme.css');
    }

    // Rewrite theme.config.ts
    const configPath = path.join(ROOT, 'src/components/themes/theme.config.ts');
    if (fs.existsSync(configPath)) {
      fs.writeFileSync(
        configPath,
        `/**
 * Default theme that loads when no user preference is set
 * Change this value to set a different default theme
 */
export const DEFAULT_THEME = '${keep.value}';

export const THEMES = [
  {
    name: '${keep.name}',
    value: '${keep.value}'
  }
];
`,
        'utf8'
      );
      this.log('✅ Rewrote: src/components/themes/theme.config.ts');
    }
  }
}

// ─── CLI ────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
🧹 Feature Cleanup Tool

Usage:
  node scripts/cleanup.js [features...]
  node scripts/cleanup.js --interactive

Examples:
  node scripts/cleanup.js clerk
  node scripts/cleanup.js kanban chat       # remove multiple at once
  node scripts/cleanup.js --interactive     # interactive mode
  node scripts/cleanup.js --dry-run kanban  # preview without changing files
  node scripts/cleanup.js --all             # remove all optional features
  node scripts/cleanup.js --list
  node scripts/cleanup.js --help

Flags:
  --interactive   Select features via interactive prompts
  --dry-run       Show what would be changed without modifying any files
  --force         Skip git safety check (not recommended)
  --all           Remove all optional features
  --list          List available features
  --help          Show this help

Safety:
  Before running, the script checks for a git repo with at least one commit
  so you can revert (git restore .) if needed. Use --force to skip this check.

Available features:
${Object.entries(FEATURES)
  .map(([key, value]) => `  - ${key.padEnd(18)} ${value.name}`)
  .join('\n')}
  `);
}

function listFeatures() {
  console.log('\n📦 Available features:\n');
  for (const [key, value] of Object.entries(FEATURES)) {
    console.log(`  ${key}`);
    console.log(`    ${value.name}`);
    if (value.folders?.length) console.log(`    Folders: ${value.folders.length}`);
    if (value.files?.length) console.log(`    Files: ${value.files.length}`);
    if (value.dependencies?.length) console.log(`    Dependencies: ${value.dependencies.length}`);
    console.log('');
  }
}

async function runInteractive(options = {}) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  console.log('\n🧹 Interactive Feature Cleanup\n');
  console.log('Select features to remove:\n');

  const selected = [];
  for (const [key, value] of Object.entries(FEATURES)) {
    const answer = await question(`  Remove ${value.name}? (y/N) `);
    if (answer.toLowerCase() === 'y') {
      selected.push(key);
    }
  }

  if (selected.length === 0) {
    console.log('\nNo features selected. Exiting.\n');
    rl.close();
    return;
  }

  console.log(`\n📋 Will remove: ${selected.join(', ')}`);
  const confirm = await question('\nProceed? (y/N) ');
  rl.close();

  if (confirm.toLowerCase() !== 'y') {
    console.log('\nCancelled.\n');
    return;
  }

  const cleanup = new FeatureCleanup(selected, options);
  await cleanup.cleanup();
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const filteredArgs = args.filter((a) => a !== '--force' && a !== '--dry-run');

  if (filteredArgs.length === 0 || filteredArgs.includes('--help')) {
    showHelp();
    return;
  }

  if (filteredArgs.includes('--list')) {
    listFeatures();
    return;
  }

  if (filteredArgs.includes('--interactive')) {
    await runInteractive({ force, dryRun });
    return;
  }

  if (filteredArgs.includes('--all')) {
    const allFeatures = Object.keys(FEATURES);
    const cleanup = new FeatureCleanup(allFeatures, {
      force,
      dryRun,
      keepTheme: 'vercel'
    });
    await cleanup.cleanup();
    return;
  }

  const features = filteredArgs.filter((a) => !a.startsWith('-'));
  const cleanup = new FeatureCleanup(features, { force, dryRun });
  await cleanup.cleanup();
}

main().catch(console.error);
