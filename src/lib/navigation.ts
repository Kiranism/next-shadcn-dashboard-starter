import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { locales } from '@/config/locales';

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });
