'use client';

import React from 'react';
import Link from 'next/link';
import { Heading } from '@/components/ui/heading'; // Assuming this is like H1, H2 etc.
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItemType {
  label: string;
  href: string;
  isCurrent?: boolean;
}

interface CustomHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  breadcrumbs?: BreadcrumbItemType[];
  actions?: React.ReactNode;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  description,
  icon: IconComponent,
  breadcrumbs,
  actions,
}) => {
  return (
    <header className="py-6 px-4 md:px-6 bg-background border-b">
      {/* Breadcrumbs Section - Placed above the main header content */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={item.href}>
                  <BreadcrumbItem>
                    {item.isCurrent ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}

      {/* Main Header: Title, Description & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Section: Icon, Title, Description */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            {IconComponent && <IconComponent className="h-7 w-7 text-primary" />}
            {/* Use Heading component. Assuming it defaults to h1 or takes a variant prop */}
            <Heading variant="h1" className="text-2xl md:text-3xl font-bold text-foreground">
              {title}
            </Heading>
          </div>
          {description && (
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>

        {/* Right Section: Actions */}
        {actions && <div className="flex-shrink-0 mt-4 md:mt-0">{actions}</div>}
      </div>
    </header>
  );
};

export default CustomHeader;
