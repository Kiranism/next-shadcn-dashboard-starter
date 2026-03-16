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

interface StatsCardProps {
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
