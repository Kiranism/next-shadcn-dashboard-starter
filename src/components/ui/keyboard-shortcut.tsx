import { cn } from '@/lib/utils';
import React, { HTMLAttributes } from 'react';
const KeyboardShortcut = React.forwardRef<
  HTMLElement,
  HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <kbd
    ref={ref}
    className={cn(
      'pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex',
      className
    )}
    {...props}
  ></kbd>
));
KeyboardShortcut.displayName = 'KeyboardShortcut';

export { KeyboardShortcut };
