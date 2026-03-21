import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { PendingAssignmentsPopover } from '@/features/trips/components/pending-assignments/pending-assignments-popover';
import { CreateTripDialogButton } from '@/features/trips/components/create-trip-dialog-button';
import SearchInput from '../search-input';

export default function Header() {
  return (
    <header className='bg-background border-border sticky top-0 flex h-16 shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex min-w-0 flex-1 items-center gap-2 overflow-hidden px-4'>
        <SidebarTrigger className='-ml-1 shrink-0' />
        <Separator orientation='vertical' className='mr-2 h-4 shrink-0' />
        <div className='min-w-0 flex-1 overflow-hidden'>
          <Breadcrumbs />
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-2 px-4'>
        <CreateTripDialogButton />
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <PendingAssignmentsPopover />
      </div>
    </header>
  );
}
