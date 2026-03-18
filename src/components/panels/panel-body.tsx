/**
 * PanelBody
 *
 * The scrollable content area of a Panel. Uses a flex-1 + min-h-0 pattern
 * which is essential for overflow-y-auto to work correctly inside a flex column
 * parent. Without min-h-0, the browser will not constrain the element's height
 * and the overflow will never trigger.
 *
 * Props:
 *   padded  — when true (default), adds px-4 py-4 inner padding
 *             set to false for edge-to-edge content (e.g. lists that need
 *             full-width hover/selected states)
 *
 * Example (padded form):
 *   <PanelBody>
 *     <ClientForm ... />
 *   </PanelBody>
 *
 * Example (edge-to-edge list):
 *   <PanelBody padded={false}>
 *     {items.map(item => <ListRow key={item.id} ... />)}
 *   </PanelBody>
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PanelBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** When true (default), adds px-4 py-4 padding inside the scrollable area */
  padded?: boolean;
}

const PanelBody = React.forwardRef<HTMLDivElement, PanelBodyProps>(
  ({ padded = true, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto',
          padded && 'px-4 py-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PanelBody.displayName = 'PanelBody';

export { PanelBody };
export type { PanelBodyProps };
