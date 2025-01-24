'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Blogs, Listing } from '@/constants/data';
import BlogsTable from './blogs-tables';
import React, { useEffect, useState } from 'react';
import { CurrentUserContextType } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';
import { getAllListing } from '@/utils/listings';
import { getStoreListing } from '@/utils/store';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getBlogs } from '@/utils/blogs';

type TUserListingPage = {};

export default function BlogsPage({}: TUserListingPage) {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;

  const [totalBlogs, setTotalBlogs] = useState<number>(0);

  const [blogs, setBlogs] = useState<Blogs[]>([]);
  const [search, setSearch] = useState(''); // Search query

  const [filteredBlogs, setFilteredBlogs] = useState<Blogs[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  useEffect(() => {
    if (user?.token) {
      getBlogs().then((res) => {
        setBlogs(res?.blogs);
        setFilteredBlogs(res?.blogs);
        setTotalBlogs(res?.meta.total);
      });
    }
  }, []);

  // Filter the data based on the search query
  useEffect(() => {
    const filtered = blogs.filter((blog) =>
      blog?.title.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredBlogs(filtered);
  }, [search, blogs]);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading title={`Blogs (${totalBlogs})`} description="" />
          <Link
            href={'/dashboard/blogs/create'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> New Blog
          </Link>
        </div>
        <Separator />
        <BlogsTable
          data={filteredBlogs}
          totalData={totalBlogs}
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
