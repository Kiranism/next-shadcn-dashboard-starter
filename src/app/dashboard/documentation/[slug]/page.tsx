import { getDocBySlug, getDocSlugs } from '@/lib/documentation';
import { MarkdownRenderer } from '@/components/documentation/markdown-renderer';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Breadcrumbs } from '@/components/breadcrumbs';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { ChevronRight } from 'lucide-react';
import { TableOfContents } from '@/components/documentation/table-of-contents';
import { getDocToc } from '@/lib/documentation';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

export async function generateStaticParams() {
  const slugs = getDocSlugs();
  return slugs.map((slug) => ({
    slug: slug.replace(/\.md$/, '')
  }));
}

export default async function DocumentationArticlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  const allSlugs = getDocSlugs();
  const allDocs = allSlugs.map((s) => getDocBySlug(s));

  const toc = getDocToc(doc.content);

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row'>
      {/* Sidebar for navigation */}
      <aside className='bg-muted/10 hidden w-64 overflow-hidden border-r lg:block'>
        <ScrollArea className='h-full px-4 py-6'>
          <div className='space-y-8'>
            {/* Table of Contents for Current Article */}
            <TableOfContents toc={toc} />

            {/* Other Articles Accordion */}
            <Accordion type='single' collapsible className='w-full'>
              <AccordionItem value='other-articles' className='border-none'>
                <AccordionTrigger className='hover:bg-accent rounded-md px-2 py-2 text-sm font-semibold hover:no-underline'>
                  Other Articles
                </AccordionTrigger>
                <AccordionContent className='pt-2'>
                  <div className='grid grid-flow-row auto-rows-max gap-1 text-sm'>
                    {allDocs.map((d) => (
                      <Link
                        key={d.slug}
                        href={`/dashboard/documentation/${d.slug}`}
                        className={cn(
                          'group hover:bg-accent flex w-full items-center rounded-md border border-transparent px-2 py-1.5 transition-colors',
                          d.slug === slug
                            ? 'text-primary bg-primary/5 font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {d.title}
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Link
              href='/dashboard/documentation'
              className='text-muted-foreground hover:text-primary flex items-center gap-2 px-2 text-xs transition-colors'
            >
              <Icons.page className='h-3 w-3' />
              Back to Overview
            </Link>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className='bg-background flex-1 overflow-y-auto'>
        <div className='animate-in fade-in mx-auto max-w-[850px] space-y-8 p-6 pt-10 duration-500 md:p-12 lg:p-16'>
          <div className='py-0'>
            <MarkdownRenderer content={doc.content} />
          </div>
        </div>
      </main>
    </div>
  );
}
