import type { ActionId, ActionImpl } from 'kbar';
import * as React from 'react';

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
      const index = action.ancestors.findIndex(
        (ancestor) => ancestor.id === currentRootActionId
      );
      return action.ancestors.slice(index + 1);
    }, [action.ancestors, currentRootActionId]);

    return (
      <div
        ref={ref}
        className={`relative z-10 flex cursor-pointer items-center justify-between px-4 py-3`}
      >
        {active && (
          <div
            id='kbar-result-item'
            className='absolute inset-0 !z-[-1] border-l-4 border-sidebar-primary bg-sidebar-accent'
          ></div>
        )}
        <div className='relative z-10 flex items-center gap-2'>
          {action.icon && action.icon}
          <div className='flex flex-col'>
            <div>
              {ancestors.length > 0 &&
                ancestors.map((ancestor) => (
                  <React.Fragment key={ancestor.id}>
                    <span className='mr-2 opacity-50'>{ancestor.name}</span>
                    <span className='mr-2'>&rsaquo;</span>
                  </React.Fragment>
                ))}
              <span>{action.name}</span>
            </div>
            {action.subtitle && (
              <span className='text-sm text-muted-foreground'>
                {action.subtitle}
              </span>
            )}
          </div>
        </div>
        {action.shortcut?.length ? (
          <div className='relative z-10 grid grid-flow-col gap-1'>
            {action.shortcut.map((sc, i) => (
              <kbd
                key={sc + i}
                className='flex items-center gap-1 rounded-md border px-1.5 py-1 text-xs font-medium shadow'
              >
                {sc}
              </kbd>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

ResultItem.displayName = 'KBarResultItem';

export default ResultItem;
