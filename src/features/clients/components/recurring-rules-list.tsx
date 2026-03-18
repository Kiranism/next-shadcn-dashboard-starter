import { useState } from 'react';
import { RecurringRule } from '@/features/trips/api/recurring-rules.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Clock,
  MapPin,
  Navigation,
  CalendarDays,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { RecurringRuleSheet } from './recurring-rule-sheet';

interface RecurringRulesListProps {
  clientId: string;
  rules: RecurringRule[];
  onRulesChange: () => void;
  /**
   * When provided, called with the rule instead of opening the Sheet overlay.
   * Used by ClientDetailPanel in the column view — the column view opens
   * Column 3 (RecurringRulePanel) instead of a floating Sheet.
   */
  onEditRule?: (rule: RecurringRule) => void;
  /**
   * When provided, called instead of opening the Sheet in create mode.
   * Used by ClientDetailPanel in the column view.
   */
  onNewRule?: () => void;
}

export function RecurringRulesList({
  clientId,
  rules,
  onRulesChange,
  onEditRule,
  onNewRule
}: RecurringRulesListProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RecurringRule | null>(null);

  const handleEdit = (rule: RecurringRule) => {
    if (onEditRule) {
      onEditRule(rule);
      return;
    }
    setSelectedRule(rule);
    setIsSheetOpen(true);
  };

  const handleCreateNew = () => {
    if (onNewRule) {
      onNewRule();
      return;
    }
    setSelectedRule(null);
    setIsSheetOpen(true);
  };

  const parseDays = (rruleString: string) => {
    const match = rruleString.match(/BYDAY=([^;]+)/);
    if (!match) return '';
    const days = match[1].split(',');

    const dayMap: Record<string, string> = {
      MO: 'Mo',
      TU: 'Di',
      WE: 'Mi',
      TH: 'Do',
      FR: 'Fr',
      SA: 'Sa',
      SU: 'So'
    };

    return days.map((d) => dayMap[d]).join(', ');
  };

  return (
    <Card className='mx-auto w-full'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-left text-xl font-bold'>
          Wiederkehrende Fahrten
        </CardTitle>
        <Button size='sm' onClick={handleCreateNew}>
          <PlusCircle className='mr-2 h-4 w-4' />
          Regel hinzufügen
        </Button>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className='border-muted bg-muted/20 flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed'>
            <RefreshCw className='text-muted-foreground/50 mb-2 h-8 w-8' />
            <p className='text-muted-foreground text-sm italic'>
              Keine wiederkehrenden Regeln vorhanden.
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`bg-card hover:border-primary/50 relative cursor-pointer overflow-hidden rounded-xl border p-4 transition-all ${!rule.is_active ? 'opacity-50' : ''}`}
                onClick={() => handleEdit(rule)}
              >
                {!rule.is_active && (
                  <div className='bg-muted text-muted-foreground absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-medium'>
                    Inaktiv
                  </div>
                )}

                <div className='flex flex-col gap-3'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full'>
                      <CalendarDays className='h-5 w-5' />
                    </div>
                    <div>
                      <div className='text-sm font-semibold'>
                        Jeden {parseDays(rule.rrule_string)}
                      </div>
                      <div className='text-muted-foreground mt-0.5 flex items-center gap-1 text-xs'>
                        ab {format(new Date(rule.start_date), 'dd.MM.yyyy')}{' '}
                        {rule.end_date &&
                          `bis ${format(new Date(rule.end_date), 'dd.MM.yyyy')}`}
                      </div>
                    </div>
                  </div>

                  <div className='mt-2 grid grid-cols-2 gap-4'>
                    {/* Hinfahrt */}
                    <div className='bg-muted/30 space-y-2 rounded-lg p-3 text-sm'>
                      <div className='text-primary mb-2 flex items-center gap-2 font-medium'>
                        <MapPin className='h-3.5 w-3.5' /> Hinfahrt
                      </div>
                      <div className='flex gap-2'>
                        <Clock className='text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0' />
                        <span className='font-mono'>
                          {rule.pickup_time.substring(0, 5)}
                        </span>
                      </div>
                      <div className='flex gap-2'>
                        <MapPin className='text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0' />
                        <span className='line-clamp-2'>
                          {rule.pickup_address}
                        </span>
                      </div>
                      <div className='flex gap-2'>
                        <Navigation className='text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0' />
                        <span className='line-clamp-2'>
                          {rule.dropoff_address}
                        </span>
                      </div>
                    </div>

                    {/* Rückfahrt */}
                    {rule.return_trip && rule.return_time ? (
                      <div className='bg-muted/30 space-y-2 rounded-lg p-3 text-sm'>
                        <div className='mb-2 flex items-center gap-2 font-medium text-rose-500'>
                          <Navigation className='h-3.5 w-3.5' /> Rückfahrt
                        </div>
                        <div className='flex gap-2'>
                          <Clock className='text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0' />
                          <span className='font-mono'>
                            {rule.return_time.substring(0, 5)}
                          </span>
                        </div>
                        <div className='flex gap-2'>
                          <MapPin className='text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0' />
                          <span className='line-clamp-2'>
                            {rule.dropoff_address}
                          </span>
                        </div>
                        <div className='flex gap-2'>
                          <Navigation className='text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0' />
                          <span className='line-clamp-2'>
                            {rule.pickup_address}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className='bg-muted/10 text-muted-foreground flex items-center justify-center rounded-lg border border-dashed p-3 text-sm italic'>
                        Keine Rückfahrt
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <RecurringRuleSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        clientId={clientId}
        initialData={selectedRule || undefined}
        onSuccess={onRulesChange}
      />
    </Card>
  );
}
