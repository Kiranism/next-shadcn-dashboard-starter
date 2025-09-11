'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const premiumButtonVariants = cva(
  'btn-medical inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        glass:
          'glass-medical bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white border-white/20 hover:border-white/30 backdrop-blur-md',
        gradient:
          'gradient-medical-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transform transition-all',
        medical:
          'bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-hover)] text-white shadow-md hover:shadow-lg'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  asChild?: boolean;
}

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(premiumButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
PremiumButton.displayName = 'PremiumButton';

// Specialized button variants for medical interface
const HeroButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, children, ...props }, ref) => (
    <PremiumButton
      ref={ref}
      variant='gradient'
      className={cn('px-6 py-3 text-base font-semibold', className)}
      {...props}
    >
      {children}
    </PremiumButton>
  )
);
HeroButton.displayName = 'HeroButton';

interface QuickActionButtonProps extends Omit<PremiumButtonProps, 'children'> {
  icon: React.ReactNode;
  label: string;
  description?: string;
  shortcut?: string;
}

const QuickActionButton = React.forwardRef<
  HTMLButtonElement,
  QuickActionButtonProps
>(({ icon, label, description, shortcut, className, ...props }, ref) => (
  <PremiumButton
    ref={ref}
    variant='glass'
    className={cn(
      'hover-lift relative h-auto flex-col gap-2 p-4 text-left',
      className
    )}
    {...props}
  >
    <div className='flex w-full items-center justify-between'>
      <div className='bg-primary/10 text-primary rounded-lg p-2'>{icon}</div>
      {shortcut && (
        <div className='text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs'>
          {shortcut}
        </div>
      )}
    </div>
    <div className='w-full'>
      <div className='text-sm font-medium text-slate-900 dark:text-white'>
        {label}
      </div>
      {description && (
        <div className='text-muted-foreground mt-1 text-xs'>{description}</div>
      )}
    </div>
  </PremiumButton>
));
QuickActionButton.displayName = 'QuickActionButton';

export { PremiumButton, HeroButton, QuickActionButton, premiumButtonVariants };
