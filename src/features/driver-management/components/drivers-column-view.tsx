'use client';

/**
 * DriversColumnView — Orchestrator for the Fahrer Miller Columns layout.
 *
 * Two columns: list + detail. Columns view is the primary layout per
 * panel-layout-system. Used at /dashboard/drivers when view=columns.
 */

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { useColumnNavigation } from '@/hooks/use-column-navigation';
import { DriverListPanel } from './driver-list-panel';
import { DriverDetailPanel } from './driver-detail-panel';

const COLUMN_KEYS = ['driverId'] as const;

export function DriversColumnView() {
  const nav = useColumnNavigation(COLUMN_KEYS);
  const { driverId } = nav.values;

  const showDetail = !!driverId;

  return (
    <div className='flex min-h-0 flex-1 overflow-hidden rounded-lg border'>
      <ResizablePanelGroup
        id='drivers-column-layout'
        direction='horizontal'
        className='h-full w-full'
        autoSaveId='drivers-column-layout'
      >
        <ResizablePanel
          id='drivers-list'
          order={1}
          defaultSize={showDetail ? 22 : 100}
          minSize={15}
        >
          <DriverListPanel
            selectedDriverId={driverId}
            onSelectDriver={(id) => nav.set({ driverId: id })}
            onNewDriver={() => nav.set({ driverId: 'new' })}
          />
        </ResizablePanel>

        {showDetail && (
          <>
            <ResizableHandle id='drivers-column-handle' withHandle />
            <ResizablePanel
              id='drivers-detail'
              order={2}
              defaultSize={78}
              minSize={28}
            >
              <DriverDetailPanel
                key={driverId}
                driverId={driverId}
                onClose={() => nav.clearAll()}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
