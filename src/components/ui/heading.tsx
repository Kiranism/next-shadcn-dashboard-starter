import React from 'react';
import { InfoButton } from '@/components/ui/info-button';
import type { InfobarContent } from '@/components/ui/infobar';

interface HeadingProps {
  title: string;
  description: string;
  infoContent?: InfobarContent;
}

export const Heading: React.FC<HeadingProps> = ({
  title,
  description,
  infoContent
}) => {
  return (
    <div className='min-w-0'>
      <div className='flex min-w-0 items-center gap-2'>
        <h2 className='min-w-0 truncate text-2xl font-bold tracking-tight sm:text-3xl'>
          {title}
        </h2>
        {infoContent && (
          <div className='pt-1'>
            <InfoButton content={infoContent} />
          </div>
        )}
      </div>
      <p className='text-muted-foreground text-sm'>{description}</p>
    </div>
  );
};
