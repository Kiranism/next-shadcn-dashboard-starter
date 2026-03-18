/**
 * PanelHeader
 *
 * A structured header for a Panel column. Renders a bottom border, title,
 * optional description, optional right-side actions slot, and an optional
 * close (X) button.
 *
 * Props:
 *   title        — primary heading text (required)
 *   description  — secondary subtitle text (optional)
 *   onClose      — if provided, renders a close button in the top-right corner
 *   actions      — arbitrary ReactNode rendered between the text block and close button
 *                  (e.g. icon buttons, badges, status indicators)
 *
 * Visual structure:
 *   ┌─────────────────────────────────────┐
 *   │ Title                    [actions][X] │
 *   │ Description (muted)                   │
 *   └─────────────────────────────────────┘
 *
 * The header intentionally has no padding override — it uses px-4 py-3 by default.
 * Override via className if you need tighter/looser spacing for a specific panel.
 */

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  onClose?: () => void;
  actions?: React.ReactNode;
}

const PanelHeader = React.forwardRef<HTMLDivElement, PanelHeaderProps>(
  ({ title, description, onClose, actions, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex shrink-0 items-start justify-between border-b px-4 py-3',
          className
        )}
        {...props}
      >
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm leading-tight font-semibold'>
            {title}
          </p>
          {description && (
            <p className='text-muted-foreground mt-0.5 truncate text-xs'>
              {description}
            </p>
          )}
        </div>

        {(actions || onClose) && (
          <div className='ml-2 flex shrink-0 items-center gap-1'>
            {actions}
            {onClose && (
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={onClose}
                aria-label='Panel schließen'
              >
                <X className='h-3.5 w-3.5' />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

PanelHeader.displayName = 'PanelHeader';

export { PanelHeader };
export type { PanelHeaderProps };
