import { cn } from '@/lib/utils';
import React from 'react';

const TextCapsule = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    className={cn(
      'flex w-fit items-center justify-center gap-1 rounded-full bg-muted-foreground px-2 py-1 text-sm text-white [&>svg]:size-4',
      className
    )}
    {...props}
    ref={ref}
  ></p>
));
TextCapsule.displayName = 'TextCapsule';

export default TextCapsule;
