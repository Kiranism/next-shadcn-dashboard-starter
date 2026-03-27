'use client';

import * as React from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useInfobar, type InfobarContent } from '@/components/ui/infobar';
import { cn } from '@/lib/utils';

interface InfoButtonProps extends Omit<React.ComponentProps<typeof Button>, 'content'> {
  content: InfobarContent;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function InfoButton({
  content,
  className,
  variant = 'ghost',
  size = 'icon',
  ...props
}: InfoButtonProps) {
  const { setContent, setOpen, open } = useInfobar();

  // Set content on mount so the infobar has it ready, but don't force it open
  const contentRef = React.useRef(content);
  contentRef.current = content;

  React.useEffect(() => {
    setContent(contentRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setContent(content);
    if (!open) {
      setOpen(true);
    }
    props.onClick?.(e);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('shrink-0', className)}
      onClick={handleClick}
      aria-label='Show information'
      {...props}
    >
      <Icons.info className='h-4 w-4' />
      <span className='sr-only'>Show information</span>
    </Button>
  );
}
