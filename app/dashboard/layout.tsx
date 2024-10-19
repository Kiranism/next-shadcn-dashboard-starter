import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import NewSidebar from '@/components/new-sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn'
};

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      {/* <Sidebar /> */}
      <NewSidebar>
        {/* <main className="w-full flex-1 overflow-hidden">
          <Header />
        </main> */}
        {children}
      </NewSidebar>
    </div>
  );
}
