'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string | number;
    isUp: boolean;
    label?: string;
  };
  isLoading?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  isLoading,
  className
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className={cn('@container/card', className)}>
        <CardHeader>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='mt-2 h-8 w-32' />
          <div className='mt-2'>
            <Skeleton className='h-5 w-16' />
          </div>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5'>
          <Skeleton className='h-3 w-32' />
          <Skeleton className='h-3 w-24' />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={cn('@container/card', className)}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {value}
        </CardTitle>
        {trend && (
          <CardAction>
            <Badge variant='outline' className='gap-1'>
              {trend.isUp ? (
                <IconTrendingUp className='size-3' />
              ) : (
                <IconTrendingDown className='size-3' />
              )}
              {trend.value}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      {(description || trend?.label) && (
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          {trend?.label && (
            <div className='line-clamp-1 flex gap-2 font-medium'>
              {trend.label}{' '}
              {trend.isUp ? (
                <IconTrendingUp className='size-4' />
              ) : (
                <IconTrendingDown className='size-4' />
              )}
            </div>
          )}
          {description && (
            <div className='text-muted-foreground'>{description}</div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Compact row layout + full-width snap slide target — used in the mobile stats carousel.
 */
export function StatsRowCard({
  title,
  value,
  description,
  trend,
  isLoading,
  className
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className={cn('min-w-0 gap-0 overflow-hidden py-0', className)}>
        <div className='flex items-center justify-between gap-3 px-4 py-3.5'>
          <div className='min-w-0 flex-1 space-y-2'>
            <Skeleton className='h-3 w-28' />
            <Skeleton className='h-3 w-36 max-w-full' />
          </div>
          <div className='flex shrink-0 flex-col items-end gap-1.5'>
            <Skeleton className='h-7 w-16' />
            <Skeleton className='h-5 w-12' />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn('min-w-0 gap-0 overflow-hidden py-0 shadow-xs', className)}
    >
      <div className='from-primary/5 to-card flex items-center justify-between gap-3 bg-gradient-to-t px-4 py-3.5'>
        <div className='min-w-0 flex-1'>
          <p className='text-muted-foreground text-xs leading-tight font-medium'>
            {title}
          </p>
          {description ? (
            <p className='text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-snug'>
              {description}
            </p>
          ) : null}
        </div>
        <div className='flex shrink-0 flex-col items-end gap-1'>
          <p className='text-xl leading-none font-semibold tracking-tight tabular-nums'>
            {value}
          </p>
          {trend ? (
            <Badge variant='outline' className='h-6 gap-0.5 px-1.5 text-[10px]'>
              {trend.isUp ? (
                <IconTrendingUp className='size-2.5' />
              ) : (
                <IconTrendingDown className='size-2.5' />
              )}
              {trend.value}
            </Badge>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
