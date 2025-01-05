'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Listing } from '@/constants/data';
import StoreTable from './store-tables';
import React, { useEffect, useState } from 'react';
import { getStoreListing } from '@/utils/store';
import { useSearchParams } from 'next/navigation';

type TUserListingPage = {};

export default function StoreListingPage({}: TUserListingPage) {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [totalListings, setTotalListings] = useState<number>(0);
  const [search, setSearch] = useState(''); // Search query
  const [filteredListing, setFilteredListing] = useState<Listing[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [storeListing, setStoreListing] = React.useState<Listing[]>([]);

  React.useEffect(() => {
    getStoreListing(id, page, limit).then((res) => {
      console.log(res.data);
      setStoreListing(res?.data);
      setFilteredListing(res?.data);
      setTotalListings(res?.meta.total);
    });
  }, [page]);

  // Filter the data based on the search query
  useEffect(() => {
    const filtered = storeListing.filter((listing) =>
      listing?.listingName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredListing(filtered);
  }, [search]);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading title={`Listings (${totalListings})`} description="" />

          {/* <Link
            href={'/dashboard/employee/new'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link> */}
        </div>
        <Separator />
        <StoreTable
          data={filteredListing}
          totalData={totalListings}
          search={search}
          setSearch={setSearch}
          page={page}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
        />
      </div>
    </PageContainer>
  );
}
