import { getDocSlugs, getDocBySlug } from '@/lib/documentation';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default function DocumentationLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const slugs = getDocSlugs();
  const docs = slugs.map((slug) => getDocBySlug(slug));

  // Simple breadcrumbs logic
  const breadcrumbItems = [
    { title: 'Dashboard', link: '/dashboard/overview' },
    { title: 'Dokumentation', link: '/dashboard/documentation' }
  ];

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
      {children}
    </div>
  );
}
