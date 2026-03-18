'use client';

/**
 * ClientDetailPanel
 *
 * Column 2 of the Fahrgäste Miller Columns view. Shows either:
 *   - Create mode (clientId === 'new'): blank ClientForm, no rules list
 *   - Edit mode   (clientId is a UUID): pre-filled ClientForm + RecurringRulesList
 *
 * After a successful save:
 *   - Create mode: URL param is updated to the new client's UUID so Column 2
 *     transitions from "create" to "edit" without a full navigation. The
 *     client list (Column 1) is also refreshed so the new entry appears.
 *   - Edit mode: form state updates in-place; rules list continues to show.
 *
 * The RecurringRulesList is wired with onEditRule/onNewRule so that clicking
 * a rule card or "Regel hinzufügen" opens Column 3 instead of the Sheet overlay.
 *
 * Props:
 *   clientId        — UUID of the client to edit, or 'new' for create mode
 *   selectedRuleId  — currently open rule id (or null); used to highlight the
 *                     active rule card in RecurringRulesList
 *   onClose         — called when the X button is pressed (clears all params)
 *   onSelectRule    — called with a rule's id to open Column 3
 *   onNewRule       — called when "Regel hinzufügen" is clicked
 *   onRuleDeselect  — called to close Column 3 (clear ruleId param)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader, PanelBody } from '@/components/panels';
import { clientsService, Client } from '../api/clients.service';
import {
  recurringRulesService,
  RecurringRule
} from '@/features/trips/api/recurring-rules.service';
import ClientForm, { ClientFormHandle } from './client-form';
import { RecurringRulesList } from './recurring-rules-list';

interface ClientDetailPanelProps {
  clientId: string;
  selectedRuleId: string | null;
  onClose: () => void;
  onSelectRule: (id: string) => void;
  onNewRule: () => void;
  onRuleDeselect: () => void;
}

export function ClientDetailPanel({
  clientId,
  selectedRuleId,
  onClose,
  onSelectRule,
  onNewRule
}: ClientDetailPanelProps) {
  const isNew = clientId === 'new';

  const formRef = useRef<ClientFormHandle>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [rules, setRules] = useState<RecurringRule[]>([]);

  // After creating a new client, we receive the saved Client object and update
  // the active clientId to the real UUID. We store it locally here and also
  // trigger a URL update via the onSuccess callback chain.
  const [activeClientId, setActiveClientId] = useState<string | null>(
    isNew ? null : clientId
  );

  // Fetch client data when the clientId changes (edit mode only)
  useEffect(() => {
    if (isNew) {
      setClient(null);
      setLoading(false);
      setActiveClientId(null);
      return;
    }

    setActiveClientId(clientId);
    setLoading(true);

    clientsService
      .getClientById(clientId)
      .then((data) => {
        setClient(data);
      })
      .catch((err: any) => {
        toast.error('Fehler beim Laden des Fahrgasts: ' + err.message);
      })
      .finally(() => setLoading(false));
  }, [clientId, isNew]);

  const fetchRules = useCallback(async () => {
    if (!activeClientId) return;
    try {
      const data = await recurringRulesService.getClientRules(activeClientId);
      setRules(data);
    } catch (err: any) {
      toast.error('Fehler beim Laden der Regelfahrten: ' + err.message);
    }
  }, [activeClientId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Derive display name for the panel header
  const displayName = getDisplayName(client, isNew);

  const handleFormSuccess = (savedClient: Client) => {
    setClient(savedClient);
    setActiveClientId(savedClient.id);

    if (isNew) {
      // Refresh Column 1 list so the new entry appears immediately
      if (typeof (window as any).__refreshClientList === 'function') {
        (window as any).__refreshClientList();
      }
      // Update URL to the real UUID — the orchestrator (ClientsColumnView)
      // will re-render Column 2 in edit mode with the correct id.
      // We trigger this by pushing the new id into the URL manually.
      const url = new URL(window.location.href);
      url.searchParams.set('clientId', savedClient.id);
      window.history.replaceState(null, '', url.toString());
    }
  };

  return (
    <Panel className='flex-1'>
      <PanelHeader
        title={displayName}
        description={isNew ? 'Neuen Fahrgast anlegen' : 'Fahrgast bearbeiten'}
        onClose={onClose}
        actions={
          !loading && (
            <Button
              size='sm'
              variant={isFormDirty ? 'default' : 'ghost'}
              className='h-6 px-2 text-xs'
              disabled={!isFormDirty}
              onClick={() => formRef.current?.submit()}
            >
              {isNew ? 'Fahrgast hinzufügen' : 'Fahrgast aktualisieren'}
            </Button>
          )
        }
      />

      <PanelBody padded>
        {loading ? (
          <div className='flex h-24 items-center justify-center'>
            <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
          </div>
        ) : (
          <div className='space-y-8'>
            {/* Client form — noCard strips the Card wrapper since Panel provides it */}
            <ClientForm
              ref={formRef}
              initialData={client}
              pageTitle=''
              noCard
              onSuccess={handleFormSuccess}
              onDirtyChange={setIsFormDirty}
            />

            {/* Recurring rules — only shown when editing an existing client */}
            {activeClientId && (
              <RecurringRulesList
                clientId={activeClientId}
                rules={rules}
                onRulesChange={fetchRules}
                onEditRule={(rule) => onSelectRule(rule.id)}
                onNewRule={onNewRule}
              />
            )}
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDisplayName(client: Client | null, isNew: boolean): string {
  if (isNew) return 'Neuer Fahrgast';
  if (!client) return '...';
  if (client.company_name) return client.company_name;
  const parts = [client.first_name, client.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unbekannt';
}
