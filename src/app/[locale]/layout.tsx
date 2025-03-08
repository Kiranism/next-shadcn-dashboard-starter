import { NextIntlClientProvider } from 'next-intl';
import { locales, defaultLocale } from '@/config/locales';
import { auth } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Next Shadcn',
  description: 'Basic dashboard with Next.js and Shadcn'
};

// Generate static params for locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: any;
}) {
  // Simple direct approach with proper awaiting of params
  let locale = defaultLocale;

  try {
    // Await params before accessing its properties
    const resolvedParams = await params;
    // Now safely access the locale property
    locale = resolvedParams?.locale || defaultLocale;
  } catch (error) {
    console.error('Error accessing locale:', error);
    // Keep using defaultLocale
  }

  // Load messages for the locale
  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Error loading messages for locale: ${locale}`, error);
    messages = (await import(`@/messages/en.json`)).default;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NuqsAdapter>
        <Toaster />
        {children}
      </NuqsAdapter>
    </NextIntlClientProvider>
  );
}
