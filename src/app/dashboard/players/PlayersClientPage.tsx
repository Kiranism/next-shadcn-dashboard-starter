'use client';

import React, { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import PlayerListingPage from '@/features/players/components/PlayerListingPage';
import CreatePlayerSidebar from '@/features/players/components/CreatePlayerSidebar';
import ImportPlaytomicSidebar from '@/features/players/components/ImportPlaytomicSidebar';

export default function PlayersClientPage() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());

  // Add new state for the Playtomic import sidebar
  const [showPlaytomicSidebar, setShowPlaytomicSidebar] = useState(false);

  function handleOpenSidebar() {
    setShowSidebar(true);
  }

  function handleCloseSidebar() {
    setShowSidebar(false);
  }

  // Handler to open/close the new Playtomic sidebar
  function handleOpenPlaytomicSidebar() {
    setShowPlaytomicSidebar(true);
  }

  function handleClosePlaytomicSidebar() {
    setShowPlaytomicSidebar(false);
  }

  function handleRefreshTable() {
    setRefreshKey(Date.now());
  }

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading title='Players' description='Manage players' />
          <div className='flex gap-2'>
            <Link
              href='#'
              onClick={(e) => {
                e.preventDefault();
                handleOpenSidebar();
              }}
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <Plus className='mr-1 h-4 w-4' />
              Add New
            </Link>

            {/* New button: "Create From Playtomic" */}
            <Link
              href='#'
              onClick={(e) => {
                e.preventDefault();
                handleOpenPlaytomicSidebar();
              }}
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <Plus className='mr-1 h-4 w-4' />
              Create From Playtomic
            </Link>
          </div>
        </div>
        <Separator />
        <PlayerListingPage key={refreshKey} />
      </div>

      {showSidebar && (
        <CreatePlayerSidebar
          onClose={handleCloseSidebar}
          onSuccess={() => {
            handleCloseSidebar();
            handleRefreshTable();
          }}
        />
      )}

      {showPlaytomicSidebar && (
        <ImportPlaytomicSidebar
          onClose={handleClosePlaytomicSidebar}
          onSuccess={() => {
            handleClosePlaytomicSidebar();
            handleRefreshTable();
          }}
        />
      )}
    </PageContainer>
  );
}
