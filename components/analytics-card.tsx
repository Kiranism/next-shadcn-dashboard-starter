'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  footer?: React.ReactNode;
  isLoading?: boolean;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  icon: IconComponent,
  description,
  footer,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-6 w-3/4" /> {/* Skeleton for Title */}
          {IconComponent && <Skeleton className="h-6 w-6" />} {/* Skeleton for Icon */}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-1/2 mb-2" /> {/* Skeleton for Value */}
          {description && <Skeleton className="h-4 w-full" />} {/* Skeleton for Description */}
        </CardContent>
        {footer && (
          <CardFooter className="pt-0"> {/* Ensure footer skeleton aligns if needed */}
            <Skeleton className="h-5 w-full" />
          </CardFooter>
        )}
      </Card>
    );
  }

  // Determine description text color based on content (basic example)
  let descriptionColor = 'text-muted-foreground';
  if (description) {
    if (description.startsWith('+')) descriptionColor = 'text-green-600 dark:text-green-500';
    if (description.startsWith('-')) descriptionColor = 'text-red-600 dark:text-red-500';
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className={`text-xs ${descriptionColor} pt-1`}>
            {description}
          </p>
        )}
      </CardContent>
      {footer && <CardFooter className="pt-0 text-sm text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
};

export default AnalyticsCard;
