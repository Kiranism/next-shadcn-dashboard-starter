import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import React from 'react';
import ListingsPage from './_components/listings-page';

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export const metadata = {
  title: 'Dashboard : Listings'
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams);

  return <ListingsPage />;
}
