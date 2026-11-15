import React from 'react';
import { Heading } from '../ui/heading';
import type { InfobarContent } from '@/components/ui/infobar';

function PageSkeleton() {
  return (
    <div
      role='status'
      aria-label='Loading page'
      className='flex flex-1 animate-pulse flex-col gap-4'
    >
      <div className='flex flex-col gap-2'>
        <div className='bg-muted h-8 w-64 rounded-md' />
        <div className='bg-muted h-4 w-96 max-w-full rounded-md' />
      </div>
      <div className='bg-muted mt-2 h-[50vh] w-full rounded-xl' />
    </div>
  );
}

export default function PageContainer({
  children,
  isLoading = false,
  access = true,
  accessFallback,
  pageTitle,
  pageDescription,
  infoContent,
  pageHeaderAction
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  access?: boolean;
  accessFallback?: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  infoContent?: InfobarContent;
  pageHeaderAction?: React.ReactNode;
}) {
  if (!access) {
    return (
      <div role='status' className='flex flex-1 items-center justify-center p-4 md:px-6'>
        {accessFallback ?? (
          <div className='text-muted-foreground text-center text-lg'>
            You do not have access to this page.
          </div>
        )}
      </div>
    );
  }

  const content = isLoading ? <PageSkeleton /> : children;

  const hasHeader = pageTitle || pageHeaderAction;

  return (
    // The layout's page scroller is the only scroll container; flex-1 lets table, chat and
    // kanban pages fill the panel while long pages simply grow and scroll
    <div className='flex min-w-0 flex-1 flex-col p-4 md:p-6'>
      {hasHeader && (
        <div className='mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3'>
          <Heading
            title={pageTitle ?? ''}
            description={pageDescription ?? ''}
            infoContent={infoContent}
          />
          {pageHeaderAction && <div className='flex flex-wrap gap-2'>{pageHeaderAction}</div>}
        </div>
      )}
      {content}
    </div>
  );
}
