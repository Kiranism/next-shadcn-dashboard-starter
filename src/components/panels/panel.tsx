/**
 * Panel
 *
 * A single column within a ColumnLayout. Renders as a full-height flex column
 * with a right border (removed on the last child via `last:border-r-0`).
 *
 * Width control:
 *   - Fixed-width panels: pass "w-[280px] shrink-0" via className
 *   - Fluid/fill panel:   pass "flex-1 min-w-0" via className
 *
 * Panel is a pure layout shell. Its children should be composed from:
 *   PanelHeader (optional)
 *   PanelBody   (required for scrollable content)
 *   PanelFooter (optional, sticky at bottom)
 *
 * Example:
 *   <Panel className="w-[460px] shrink-0">
 *     <PanelHeader title="Fahrgast bearbeiten" onClose={handleClose} />
 *     <PanelBody>
 *       <ClientForm ... />
 *     </PanelBody>
 *     <PanelFooter>
 *       <Button type="submit">Speichern</Button>
 *     </PanelFooter>
 *   </Panel>
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-full flex-col border-r last:border-r-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';

export { Panel };
export type { PanelProps };
