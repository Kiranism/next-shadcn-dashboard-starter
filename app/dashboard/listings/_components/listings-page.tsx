'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Listing } from '@/constants/data';
import ListingTable from './store-tables';
import React, { useEffect, useState } from 'react';
import { CurrentUserContextType } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';
import { getAllListing } from '@/utils/listings';

type TUserListingPage = {};

export default function ListingsPage({}: TUserListingPage) {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;

  const [totalListings, setTotalListings] = useState<number>(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState(''); // Search query
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  useEffect(() => {
    if (user?.token) {
      getAllListing(page, limit).then((res) => {
        console.log(res?.data);
        setListings(res?.data);
        setFilteredListings(res?.data);
        setTotalListings(res?.meta.total);
      });
    }
  }, [user, page]);

  // Filter the data based on the search query
  useEffect(() => {
    const filtered = listings.filter((listing) =>
      listing?.listingName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredListings(filtered);
  }, [search, listings]);

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
        <ListingTable
          data={filteredListings}
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
