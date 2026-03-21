import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heading } from '../ui/heading';
import type { InfobarContent } from '@/components/ui/infobar';

function PageSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4 p-4 md:px-6'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='bg-muted mb-2 h-8 w-48 rounded' />
          <div className='bg-muted h-4 w-96 rounded' />
        </div>
      </div>
      <div className='bg-muted mt-6 h-40 w-full rounded-lg' />
      <div className='bg-muted h-40 w-full rounded-lg' />
    </div>
  );
}

export default function PageContainer({
  children,
  scrollable = true,
  isloading = false,
  access = true,
  accessFallback,
  pageTitle,
  pageDescription,
  infoContent,
  pageHeaderAction
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  isloading?: boolean;
  access?: boolean;
  accessFallback?: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  infoContent?: InfobarContent;
  pageHeaderAction?: React.ReactNode;
}) {
  if (!access) {
    return (
      <div className='flex min-h-0 flex-1 items-center justify-center p-4 md:px-6'>
        {accessFallback ?? (
          <div className='text-muted-foreground text-center text-lg'>
            You do not have access to this page.
          </div>
        )}
      </div>
    );
  }

  const content = isloading ? <PageSkeleton /> : children;

  return scrollable ? (
    <ScrollArea className='min-h-0 flex-1'>
      <div className='flex flex-1 flex-col p-4 md:px-6'>
        <div className='mb-4 flex min-w-0 shrink-0 flex-row items-start justify-between gap-2 sm:gap-4'>
          <div className='min-w-0 flex-1'>
            <Heading
              title={pageTitle ?? ''}
              description={pageDescription ?? ''}
              infoContent={infoContent}
            />
          </div>
          {pageHeaderAction && (
            <div className='flex shrink-0 flex-nowrap items-center justify-end gap-2 overflow-x-auto'>
              {pageHeaderAction}
            </div>
          )}
        </div>
        {content}
      </div>
    </ScrollArea>
  ) : (
    // Fills SidebarInset below Header via flex-1 min-h-0 (dashboard layout wrapper).
    // overflow-hidden: child panels own their scroll.
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:px-6'>
      <div className='mb-4 flex min-w-0 shrink-0 flex-row items-start justify-between gap-2 sm:gap-4'>
        <div className='min-w-0 flex-1'>
          <Heading
            title={pageTitle ?? ''}
            description={pageDescription ?? ''}
            infoContent={infoContent}
          />
        </div>
        {pageHeaderAction && (
          <div className='flex shrink-0 flex-nowrap items-center justify-end gap-2 overflow-x-auto'>
            {pageHeaderAction}
          </div>
        )}
      </div>
      {content}
    </div>
  );
}
