'use client';

import * as React from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import {
  Infobar,
  InfobarContent,
  InfobarGroup,
  InfobarGroupContent,
  InfobarHeader,
  InfobarRail,
  InfobarTrigger,
  useInfobar
} from '@/components/ui/infobar';

// Default/fallback data when no content is set
const defaultData = {
  title: 'Documentation',
  sections: [
    {
      title: 'Getting Started',
      description: 'Learn how to get started with this application.',
      links: [
        {
          title: 'Installation Guide',
          url: '#'
        }
      ]
    }
  ]
};

export function InfoSidebar({
  ...props
}: React.ComponentProps<typeof Infobar>) {
  const { content } = useInfobar();
  const data = content || defaultData;

  return (
    <Infobar {...props}>
      <InfobarHeader className='flex flex-row items-start justify-between gap-2 border-b px-3 py-3'>
        <div className='min-w-0 flex-1'>
          <h2 className='text-lg font-semibold wrap-break-word'>
            {data.title}
          </h2>
        </div>
        <div className='shrink-0'>
          <InfobarTrigger className='-mr-1' />
        </div>
      </InfobarHeader>
      <InfobarContent>
        <InfobarGroup>
          <InfobarGroupContent>
            <div className='flex flex-col gap-6 px-4 py-4'>
              {data.sections && data.sections.length > 0 ? (
                data.sections.map((section, index) => (
                  <div key={index} className='flex flex-col gap-3'>
                    {section.title && (
                      <h3 className='text-foreground text-sm font-semibold'>
                        {section.title}
                      </h3>
                    )}
                    {section.description && (
                      <p className='text-muted-foreground text-sm leading-relaxed'>
                        {section.description}
                      </p>
                    )}
                    {section.links && section.links.length > 0 && (
                      <div className='flex flex-col gap-2'>
                        <h4 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                          Learn more
                        </h4>
                        <ul className='flex flex-col gap-1.5'>
                          {section.links.map((link, linkIndex) => (
                            <li key={linkIndex}>
                              <Link
                                href={link.url}
                                className='text-primary flex items-center gap-1.5 text-sm underline'
                                target='_blank'
                              >
                                <span>{link.title}</span>
                                <IconChevronRight className='h-3 w-3' />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className='text-muted-foreground px-2 py-4 text-center text-sm'>
                  No content available
                </div>
              )}
            </div>
          </InfobarGroupContent>
        </InfobarGroup>
      </InfobarContent>
      <InfobarRail />
    </Infobar>
  );
}
