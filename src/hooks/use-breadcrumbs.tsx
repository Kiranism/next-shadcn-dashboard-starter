'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { locales } from '@/config/locales';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/employee': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Employee', link: '/dashboard/employee' }
  ],
  '/dashboard/product': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Product', link: '/dashboard/product' }
  ],
  '/dashboard/tournament': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Tournament', link: '/dashboard/tournament' }
  ],
  '/dashboard/tournament/overview': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Tournament', link: '/dashboard/tournament' },
    { title: 'Overview', link: '/dashboard/tournament/overview' }
  ]
  // Add more custom mappings as needed
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, generate breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);

    // Skip the locale segment if it's a recognized locale
    const startIndex =
      segments.length > 0 && locales.includes(segments[0] as any) ? 1 : 0;

    // Map remaining segments to breadcrumb items
    return segments.slice(startIndex).map((segment, index) => {
      // We need to keep the original path including the locale for links to work
      const pathSegments = segments.slice(0, startIndex + index + 1);
      const path = `/${pathSegments.join('/')}`;

      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
