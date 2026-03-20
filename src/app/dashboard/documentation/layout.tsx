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
    <div className='flex h-full'>
      {/* Optional: we could have a sidebar here too, but for now let's keep it simple or use the landing page as the main nav */}
      <div className='flex-1 overflow-y-auto'>{children}</div>
    </div>
  );
}
