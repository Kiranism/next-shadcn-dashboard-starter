'use client';

import { usePathname } from 'next/navigation';
import TranslatedSidebar from './translated-sidebar';

export default function AppSidebar() {
  const pathname = usePathname();

  // Check if the pathname includes a locale segment
  const hasLocale =
    pathname.split('/').length > 1 && pathname.split('/')[1] !== '';

  return <TranslatedSidebar />;
}
