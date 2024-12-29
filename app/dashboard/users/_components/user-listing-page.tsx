'use client';

import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Employee, users, Users } from '@/constants/data';
import { fakeUsers } from '@/constants/mock-api';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import EmployeeTable from './employee-tables';
import React, { useEffect, useState } from 'react';
import { getAllUsers } from '@/utils/user';
import { CurrentUserContextType } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';

type TUserListingPage = {};

export default function UserListingPage({}: TUserListingPage) {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;

  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [users, setUsers] = useState<Users[]>([]);
  const [search, setSearch] = useState(''); // Search query
  const [filteredUsers, setFilteredUsers] = useState<Users[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  useEffect(() => {
    if (user?.token) {
      getAllUsers(page, user?.token, limit).then((res) => {
        console.log(res.users);
        setUsers(res?.users);
        setTotalUsers(res?.meta.total);
      });
    }
  }, [user, page]);

  // Filter the data based on the search query
  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user?.firstname.toLowerCase().includes(search.toLowerCase()) ||
        user?.lastname.toLowerCase().includes(search.toLowerCase()) ||
        user?.email.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  // const [data, setData] = useState<Users[]>([])
  // const [totalUsers, setTotalUsers] = useState<number>(0)

  // Showcasing the use of search params cache in nested RSCs
  // const page = searchParamsCache.get('page');
  // const search = searchParamsCache.get('q');
  // const gender = searchParamsCache.get('gender');
  // const pageLimit = searchParamsCache.get('limit');

  // const filters = {
  //   page,
  //   limit: pageLimit,
  //   ...(search && { search }),
  // };

  //mock api call
  // const data = await allUsers.getUsers(filters);
  // const totalUsers = data.total_users;
  // const users: Users[] = data.users;

  // console.log(data)

  // mock api call
  // const data = await fakeUsers.getUsers(filters);
  // const totalUsers = data.total_users;
  // const employee: Employee[] = data.users;

  // useEffect(() => {
  //   if (user?.token) {
  //     getAllUsers(user?.token).then((res) => {
  //       console.log(res.users)
  //       setData(res?.users)
  //       setTotalUsers(res?.meta?.total)
  //   })
  // }
  // },[user])

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading title={`Users (${totalUsers})`} description="" />

          {/* <Link
            href={'/dashboard/employee/new'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link> */}
        </div>
        <Separator />
        <EmployeeTable
          data={filteredUsers}
          totalData={totalUsers}
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
