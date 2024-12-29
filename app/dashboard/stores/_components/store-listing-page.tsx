'use client';

import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Stores } from '@/constants/data';
import { fakeUsers } from '@/constants/mock-api';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import StoreTable from './store-tables';
import React, { useEffect, useState } from 'react';
import { CurrentUserContextType } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';
import { getAllStores } from '@/utils/store';

type TUserListingPage = {};

export default function StoreListingPage({}: TUserListingPage) {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;

  const [totalStores, setTotalStores] = useState<number>(0);
  const [stores, setStores] = useState<Stores[]>([]);
  const [search, setSearch] = useState(''); // Search query
  const [filteredStores, setFilteredStores] = useState<Stores[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  useEffect(() => {
    if (user?.token) {
      getAllStores(page, limit).then((res) => {
        console.log(res?.stores);
        setStores(res?.stores);
        setFilteredStores(res?.stores);
        setTotalStores(res?.meta.total);
      });
    }
  }, [user, page]);

  // Filter the data based on the search query
  useEffect(() => {
    const filtered = stores.filter((store) =>
      store?.storeName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredStores(filtered);
  }, [search, stores]);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading title={`Stores (${totalStores})`} description="" />

          {/* <Link
            href={'/dashboard/employee/new'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link> */}
        </div>
        <Separator />
        <StoreTable
          data={filteredStores}
          totalData={totalStores}
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
