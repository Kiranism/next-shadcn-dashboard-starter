/**
 * ColumnLayout
 *
 * The outermost container for a Miller Columns / progressive-disclosure layout.
 * Renders a horizontal flex row. Intentionally does NOT set h-full or w-full —
 * height and width are the consumer's responsibility so this component composes
 * cleanly into any flex/grid parent without assuming its own dimensions.
 *
 * Typical usage inside a full-height page:
 *   <div className="flex-1 min-h-0 overflow-hidden">
 *     <ColumnLayout>
 *       ...panels...
 *     </ColumnLayout>
 *   </div>
 *
 * Or when using ResizablePanelGroup (preferred for resizable layouts):
 *   The ResizablePanelGroup replaces ColumnLayout as the container; this
 *   component provides the outer border/rounded styling via className.
 *
 * The component applies no padding; each Panel is responsible for its own
 * internal spacing. The outer border and rounded corners give the whole
 * layout a card-like appearance consistent with the dashboard aesthetic.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ColumnLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ColumnLayout = React.forwardRef<HTMLDivElement, ColumnLayoutProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex overflow-hidden rounded-lg border', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ColumnLayout.displayName = 'ColumnLayout';

export { ColumnLayout };
export type { ColumnLayoutProps };
