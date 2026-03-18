'use client';

/**
 * ClientsColumnView
 *
 * Orchestrator for the Fahrgäste Miller Columns layout.
 *
 * Layout strategy:
 *   - The wrapper div uses `flex-1 min-h-0` to fill the remaining height inside
 *     PageContainer's flex column. Without `min-h-0`, flex children don't
 *     constrain to their parent's height and the whole page scrolls.
 *   - ResizablePanelGroup fills the wrapper and gives each column a percentage-
 *     based default width that the user can freely drag to resize.
 *   - Panels are identified by stable `id` props so react-resizable-panels can
 *     redistribute space correctly when Column 2 or 3 appears/disappears.
 *
 * Default proportions (add up to 100):
 *   Column 1 (list):   22%
 *   Column 2 (detail): 78%   → when Column 3 is absent
 *   Column 2 (detail): 44%   → when Column 3 is present
 *   Column 3 (rule):   34%
 *
 * Column visibility rules:
 *   Column 1 — always visible
 *   Column 2 — visible when clientId is set
 *   Column 3 — visible when clientId (not 'new') AND ruleId are set
 *
 * URL params managed:
 *   ?clientId=<uuid>|'new'  — selected client
 *   ?ruleId=<uuid>|'new'    — selected rule
 */

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { useColumnNavigation } from '@/hooks/use-column-navigation';
import { ClientListPanel } from './client-list-panel';
import { ClientDetailPanel } from './client-detail-panel';
import { RecurringRulePanel } from './recurring-rule-panel';

const COLUMN_KEYS = ['clientId', 'ruleId'] as const;

export function ClientsColumnView() {
  const nav = useColumnNavigation(COLUMN_KEYS);
  const { clientId, ruleId } = nav.values;

  const showDetail = !!clientId;
  const showRule = !!(clientId && clientId !== 'new' && ruleId);

  // Default sizes shift when Column 3 appears so Column 2 doesn't get crushed
  const detailDefaultSize = showRule ? 44 : 78;

  return (
    // flex-1 min-h-0: fills the remaining height in PageContainer's flex column
    // overflow-hidden: prevents the panel content from bleeding outside the border
    <div className='flex min-h-0 flex-1 overflow-hidden rounded-lg border'>
      <ResizablePanelGroup
        direction='horizontal'
        className='h-full w-full'
        autoSaveId='clients-column-layout'
      >
        {/* ── Column 1: Client List ────────────────────────────── */}
        <ResizablePanel
          id='clients-list'
          order={1}
          defaultSize={showDetail ? 22 : 100}
          minSize={15}
        >
          <ClientListPanel
            selectedClientId={clientId}
            onSelectClient={(id) => nav.set({ clientId: id, ruleId: null })}
            onNewClient={() => nav.set({ clientId: 'new', ruleId: null })}
          />
        </ResizablePanel>

        {/* ── Column 2: Client Detail ───────────────────────────── */}
        {showDetail && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              id='clients-detail'
              order={2}
              defaultSize={detailDefaultSize}
              minSize={28}
            >
              {/* key={clientId} forces a full remount when the selected client
                  changes so useForm inside ClientForm reinitialises with fresh
                  defaultValues — prevents stale form state leaking between clients */}
              <ClientDetailPanel
                key={clientId}
                clientId={clientId}
                selectedRuleId={ruleId}
                onClose={() => nav.clearAll()}
                onSelectRule={(id) => nav.set({ ruleId: id })}
                onNewRule={() => nav.set({ ruleId: 'new' })}
                onRuleDeselect={() => nav.clear('ruleId')}
              />
            </ResizablePanel>
          </>
        )}

        {/* ── Column 3: Recurring Rule Form ─────────────────────── */}
        {showRule && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              id='clients-rule'
              order={3}
              defaultSize={34}
              minSize={22}
            >
              <RecurringRulePanel
                clientId={clientId!}
                ruleId={ruleId!}
                onClose={() => nav.clear('ruleId')}
                onSuccess={() => nav.clear('ruleId')}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
