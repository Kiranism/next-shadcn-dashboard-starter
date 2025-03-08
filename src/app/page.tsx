import { redirect } from 'next/navigation';
import { defaultLocale } from '@/config/locales';

export default function RootPage() {
  // Redirect to the localized home page
  redirect(`/${defaultLocale}`);
}
