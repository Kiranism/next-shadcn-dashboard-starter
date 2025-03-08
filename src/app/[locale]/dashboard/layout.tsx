import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@/lib/auth';
import { redirect } from '@/lib/navigation';
import { cookies, headers } from 'next/headers';
import LanguageSwitcher from '@/components/language-switcher';
import type { Metadata } from 'next';
import { defaultLocale } from '@/config/locales';

export const metadata: Metadata = {
  title: 'Tourn.me - Tournament Management',
  description: 'Tournament Management System'
};

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  try {
    // Make sure we await all async operations
    const session = await auth();

    if (!session?.user) {
      // Get the locale from the URL path
      // Instead of relying on headers for locale, we'll determine it from the URL
      return redirect(`/${defaultLocale}`);
    }

    // Persisting the sidebar state in the cookie.
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true';

    return (
      <KBar>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarInset>
            <Header />
            {/* page main content */}
            {children}
            {/* page main content ends */}
          </SidebarInset>
        </SidebarProvider>
      </KBar>
    );
  } catch (error) {
    console.error('Error in dashboard layout:', error);
    // In case of error, redirect to home
    return redirect(`/${defaultLocale}`);
  }
}
