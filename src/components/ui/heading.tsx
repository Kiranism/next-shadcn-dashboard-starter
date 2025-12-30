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
    <div>
      <div className='flex items-center gap-2'>
        <h2 className='text-3xl font-bold tracking-tight'>{title}</h2>
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
