'use client';

import { DocToc } from '@/lib/documentation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface TableOfContentsProps {
  toc: DocToc[];
}

export function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -80% 0%' }
    );

    toc.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <div className='space-y-4'>
      <h4 className='px-2 text-sm font-semibold tracking-tight'>
        On this page
      </h4>
      <div className='grid grid-flow-row auto-rows-max gap-1 text-sm'>
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              'group hover:bg-accent flex w-full items-center rounded-md border border-transparent px-2 py-1.5 transition-colors',
              item.level === 2 && 'pl-4 text-xs',
              activeId === item.id
                ? 'text-primary bg-primary/5 font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById(item.id)
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {item.text}
          </a>
        ))}
      </div>
    </div>
  );
}
