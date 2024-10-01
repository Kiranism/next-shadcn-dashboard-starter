import { ProfileViewPage } from '@/sections/profile/view';
import { SearchParams } from 'nuqs/parsers';

type pageProps = {
  searchParams: SearchParams;
};

export const metadata = {
  title: 'Dashboard : Profile'
};

export default async function Page({ searchParams }: pageProps) {
  return <ProfileViewPage />;
}
