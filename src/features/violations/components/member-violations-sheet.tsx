'use client';

import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { SeverityBadge } from './severity-badge';
import { ViolationsRepository } from '@/repositories/violations.repository';
import { toUserMessage } from '@/lib/api-client';
import type { UserViolations } from '@/types/violations';
import type { NormSeverity } from '@/types/norms';

const severityCodeColor: Record<NormSeverity, string> = {
  leve: 'text-emerald-600 dark:text-emerald-400',
  moderada: 'text-yellow-600 dark:text-yellow-400',
  grave: 'text-orange-600 dark:text-orange-400',
  desligamento: 'text-red-600 dark:text-red-400'
};

interface MemberViolationsSheetProps {
  entry: UserViolations | null;
  memberName: string;
  memberRole?: string;
  onClose: () => void;
  canCancel: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function MemberViolationsSheet({
  entry,
  memberName,
  memberRole,
  onClose,
  canCancel
}: MemberViolationsSheetProps) {
  const cancelMutation = ViolationsRepository.useCancel();

  function handleCancel(violationId: string) {
    cancelMutation.mutate(violationId, {
      onSuccess: () => toast.success('Falta cancelada.'),
      onError: (err) => toast.error(toUserMessage(err))
    });
  }

  const summary = entry?.summary;
  const violations = entry?.violations ?? [];

  return (
    <Sheet open={!!entry} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-md'>
        <SheetHeader className='border-b px-6 py-5'>
          <div className='flex items-start gap-3'>
            <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted'>
              <Icons.user2 className='size-5 text-muted-foreground' />
            </div>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <SheetTitle className='text-base'>{memberName}</SheetTitle>
                {summary &&
                  (summary.active_desligamentos > 0 ? (
                    <Badge variant='destructive' className='text-xs'>
                      Desligamento
                    </Badge>
                  ) : summary.at_risk ? (
                    <Badge variant='destructive' className='text-xs'>
                      Em Risco
                    </Badge>
                  ) : null)}
              </div>
              {memberRole && (
                <SheetDescription className='capitalize'>{memberRole}</SheetDescription>
              )}
            </div>
          </div>

          {summary && (
            <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
              <ScoreStat label='Score' value={summary.score} highlight={summary.at_risk} />
              <ScoreStat label='Leves' value={summary.active_leves} />
              <ScoreStat label='Moderadas' value={summary.active_moderadas} />
              <ScoreStat label='Graves' value={summary.active_graves} />
            </div>
          )}
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {violations.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-12 text-center'>
              <Icons.circleCheck className='text-muted-foreground size-10' />
              <p className='text-muted-foreground text-sm'>Nenhuma falta registrada.</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {violations.map((v) => (
                <div key={v.id} className='rounded-lg border bg-muted/20 p-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0 space-y-1.5'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span
                          className={`font-mono text-xs font-semibold ${severityCodeColor[v.norm.severity]}`}
                        >
                          {v.norm.code}
                        </span>
                        <SeverityBadge severity={v.norm.severity} />
                        {v.status === 'cancelled' && (
                          <Badge variant='secondary' className='text-xs'>
                            Cancelada
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm'>{v.norm.description}</p>
                      {v.reason && (
                        <p className='text-muted-foreground text-xs'>
                          <span className='font-medium'>Motivo:</span> {v.reason}
                        </p>
                      )}
                      <p className='text-muted-foreground text-xs'>
                        Aplicada em {formatDate(v.applied_at)}
                      </p>
                    </div>
                    {canCancel && v.status === 'active' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8 shrink-0 text-destructive hover:text-destructive'
                            disabled={cancelMutation.isPending}
                            aria-label='Cancelar falta'
                          >
                            <Icons.trash className='size-4' />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar falta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              A falta <strong>{v.norm.code}</strong> será cancelada. Ela continuará
                              no histórico mas não contará para o score.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancel(v.id)}
                              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            >
                              Cancelar falta
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ScoreStat({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className='rounded-lg border bg-muted/30 px-3 py-2 text-center'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}
