/**
 * PanelFooter
 *
 * A sticky bottom footer for a Panel. Uses mt-auto to push itself to the
 * bottom of the flex column, with a top border separating it from the body.
 *
 * Typical use: form action buttons (Cancel + Submit), or navigation actions.
 *
 * The footer renders its children in a right-aligned flex row by default.
 * Use className to override alignment if needed.
 *
 * Example:
 *   <PanelFooter>
 *     <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
 *     <Button type="submit">Speichern</Button>
 *   </PanelFooter>
 *
 * Note: PanelFooter only sticks to the bottom when its Panel has
 * flex flex-col and its sibling PanelBody has min-h-0 flex-1.
 * Both Panel and PanelBody enforce this — no extra setup needed.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PanelFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const PanelFooter = React.forwardRef<HTMLDivElement, PanelFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex shrink-0 items-center justify-end gap-2 border-t px-4 py-3',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PanelFooter.displayName = 'PanelFooter';

export { PanelFooter };
export type { PanelFooterProps };
