import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import {
  recurringRulesService,
  RecurringRule
} from '@/features/trips/api/recurring-rules.service';
import {
  RecurringRuleFormBody,
  RuleFormValues,
  ruleFormSchema,
  getRuleFormDefaults
} from './recurring-rule-form-body';

/**
 * RecurringRuleSheet
 *
 * Slide-over Sheet overlay for creating or editing a recurring trip rule.
 * Used in the classic (non-column) page view — e.g. from /dashboard/clients/[id].
 *
 * The form content is shared with RecurringRulePanel (the column view variant)
 * via the RecurringRuleFormBody component. The external API of this component
 * is intentionally unchanged so that all existing call sites keep working.
 *
 * External API (props) — do not change without updating all consumers:
 *   isOpen        — controls Sheet open state
 *   onOpenChange  — called when Sheet requests close
 *   clientId      — the client this rule belongs to
 *   initialData   — if provided, form renders in edit mode
 *   onSuccess     — called after a successful create or update
 */

interface RecurringRuleSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  initialData?: RecurringRule;
  onSuccess: () => void;
}

export function RecurringRuleSheet({
  isOpen,
  onOpenChange,
  clientId,
  initialData,
  onSuccess
}: RecurringRuleSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: getRuleFormDefaults(initialData)
  });

  // Reset form whenever the sheet opens or the target rule changes
  React.useEffect(() => {
    if (isOpen) {
      form.reset(getRuleFormDefaults(initialData));
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (values: RuleFormValues) => {
    try {
      setIsSubmitting(true);

      const rruleString = `FREQ=WEEKLY;BYDAY=${values.days.join(',')}`;
      const ruleData = {
        client_id: clientId,
        rrule_string: rruleString,
        pickup_time: `${values.pickup_time}:00`,
        pickup_address: values.pickup_address,
        dropoff_address: values.dropoff_address,
        return_trip: values.return_trip,
        return_time:
          values.return_trip && values.return_time
            ? `${values.return_time}:00`
            : null,
        start_date: values.start_date,
        end_date: values.end_date || null,
        is_active: values.is_active
      };

      if (initialData) {
        await recurringRulesService.updateRule(initialData.id, ruleData);
        toast.success('Regel erfolgreich aktualisiert');
      } else {
        await recurringRulesService.createRule(ruleData);
        toast.success('Regel erfolgreich erstellt');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col p-0 sm:max-w-md'>
        <SheetHeader className='border-b px-6 py-4'>
          <SheetTitle>
            {initialData ? 'Regel bearbeiten' : 'Neue wiederkehrende Fahrt'}
          </SheetTitle>
          <SheetDescription>
            Konfigurieren Sie die Wochentage und Zeiten für diese Regelfahrt.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable form fields only — footer is outside this scroll area */}
        <div className='min-h-0 flex-1 overflow-y-auto px-6'>
          <form
            id='recurring-rule-sheet-form'
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <RecurringRuleFormBody form={form} showIsActive={!!initialData} />
          </form>
        </div>

        {/* Fixed footer — never scrolls away */}
        <div className='flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            type='submit'
            form='recurring-rule-sheet-form'
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {initialData ? 'Speichern' : 'Hinzufügen'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
