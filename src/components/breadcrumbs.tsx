'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';
import { Fragment, useMemo } from 'react';

interface BreadcrumbsProps {
  items?: {
    title: string;
    link: string;
  }[];
}

export function Breadcrumbs({ items: manualItems }: BreadcrumbsProps) {
  const pathname = usePathname();

  const items = useMemo(() => {
    if (manualItems) return manualItems;

    // Auto-generate from pathname
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const link = `/${segments.slice(0, index + 1).join('/')}`;
      const title = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return { title, link };
    });
  }, [pathname, manualItems]);

  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={item.link}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.link}>{item.title}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
