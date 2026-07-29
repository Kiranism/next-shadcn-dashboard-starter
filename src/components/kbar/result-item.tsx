import type { ActionId, ActionImpl } from 'kbar';
import * as React from 'react';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';

const ResultItem = React.forwardRef(
  (
    {
      action,
      active,
      currentRootActionId
    }: {
      action: ActionImpl;
      active: boolean;
      currentRootActionId: ActionId;
    },
    ref: React.Ref<HTMLDivElement>
  ) => {
    const ancestors = React.useMemo(() => {
      if (!currentRootActionId) return action.ancestors;
      const index = action.ancestors.findIndex((ancestor) => ancestor.id === currentRootActionId);
      return action.ancestors.slice(index + 1);
    }, [action.ancestors, currentRootActionId]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative mx-1.5 flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2.5 text-sm',
          active && 'bg-accent text-accent-foreground'
        )}
      >
        <div className='flex items-center gap-2'>
          {action.icon}
          <div className='flex flex-col'>
            <div>
              {ancestors.length > 0 &&
                ancestors.map((ancestor) => (
                  <React.Fragment key={ancestor.id}>
                    <span className='text-muted-foreground mr-2'>{ancestor.name}</span>
                    <span className='mr-2'>&rsaquo;</span>
                  </React.Fragment>
                ))}
              <span>{action.name}</span>
            </div>
            {action.subtitle && (
              <span className='text-muted-foreground text-xs'>{action.subtitle}</span>
            )}
          </div>
        </div>
        {action.shortcut?.length ? (
          <div className='grid grid-flow-col gap-1'>
            {action.shortcut.map((sc, i) => (
              <Kbd key={sc + i}>{sc}</Kbd>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

ResultItem.displayName = 'KBarResultItem';

export default ResultItem;
