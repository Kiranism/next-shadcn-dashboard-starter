'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { toUserMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { MyInterviewSlot, EvaluationScores, EvaluationFlags } from '@/types/selection-process';

// ─── Config ───────────────────────────────────────────────────────────────────

const TZ = 'America/Sao_Paulo';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TZ
  });
}

const SCORE_KEY_ORDER: (keyof EvaluationScores)[] = [
  'proatividade',
  'lideranca',
  'comunicacao',
  'criatividade',
  'transparencia',
  'proposito',
  'autoresponsabilidade',
  'responsabilidade_social',
  'seriedade',
  'compromisso',
  'uniao_de_time',
  'autoconfianca'
];

const SCORE_GROUPS: { label: string; keys: (keyof EvaluationScores)[] }[] = [
  {
    label: 'Iniciativa & Expressão',
    keys: ['proatividade', 'lideranca', 'comunicacao', 'criatividade']
  },
  {
    label: 'Valores & Propósito',
    keys: ['transparencia', 'proposito', 'autoresponsabilidade', 'responsabilidade_social']
  },
  {
    label: 'Postura & Equipe',
    keys: ['seriedade', 'compromisso', 'uniao_de_time', 'autoconfianca']
  }
];

const SCORE_LABELS: Record<keyof EvaluationScores, string> = {
  proatividade: 'Proatividade',
  lideranca: 'Liderança',
  transparencia: 'Transparência',
  uniao_de_time: 'União de Time',
  comunicacao: 'Comunicação',
  seriedade: 'Seriedade',
  compromisso: 'Comprometimento',
  proposito: 'Propósito',
  autoresponsabilidade: 'Autorresponsabilidade',
  autoconfianca: 'Autoconfiança',
  responsabilidade_social: 'Resp. Social',
  criatividade: 'Criatividade'
};

const FLAG_KEYS: (keyof EvaluationFlags)[] = [
  'procrastinacao',
  'desinteresse',
  'falta_de_transparencia',
  'proposito_vago',
  'vitimizacao',
  'falta_de_confianca'
];

const FLAG_LABELS: Record<keyof EvaluationFlags, string> = {
  procrastinacao: 'Procrastinação',
  desinteresse: 'Desinteresse',
  falta_de_transparencia: 'Falta de Transparência',
  proposito_vago: 'Propósito Vago',
  vitimizacao: 'Vitimização',
  falta_de_confianca: 'Falta de Confiança'
};

const SCORE_STYLES: Record<number, string> = {
  1: 'bg-red-500 border-red-500 text-white',
  2: 'bg-orange-500 border-orange-500 text-white',
  3: 'bg-yellow-400 border-yellow-400 text-yellow-950',
  4: 'bg-lime-500 border-lime-500 text-lime-950',
  5: 'bg-emerald-500 border-emerald-500 text-white'
};

const SCORE_LABELS_DESC = ['', 'Muito abaixo', 'Abaixo', 'Regular', 'Bom', 'Excelente'];

const DEFAULT_SCORES: EvaluationScores = {
  proatividade: 0,
  lideranca: 0,
  transparencia: 0,
  uniao_de_time: 0,
  comunicacao: 0,
  seriedade: 0,
  compromisso: 0,
  proposito: 0,
  autoresponsabilidade: 0,
  autoconfianca: 0,
  responsabilidade_social: 0,
  criatividade: 0
};

const DEFAULT_FLAGS: EvaluationFlags = {
  procrastinacao: false,
  desinteresse: false,
  falta_de_transparencia: false,
  proposito_vago: false,
  vitimizacao: false,
  falta_de_confianca: false
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreSelector({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between min-h-5'>
        <span className='text-sm font-medium'>{label}</span>
        {value > 0 && (
          <span
            className={cn(
              'text-[0.65rem] font-semibold px-1.5 py-0.5 rounded-full',
              SCORE_STYLES[value]
            )}
          >
            {SCORE_LABELS_DESC[value]}
          </span>
        )}
      </div>
      <div className='flex gap-1.5'>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type='button'
            onClick={() => onChange(n)}
            aria-label={`${n} — ${SCORE_LABELS_DESC[n]}`}
            className={cn(
              'flex-1 h-11 rounded-xl border-2 text-sm font-bold transition-all active:scale-95',
              value === n
                ? SCORE_STYLES[n]
                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function FlagChip({
  label,
  active,
  onChange
}: {
  label: string;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type='button'
      onClick={() => onChange(!active)}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95',
        active
          ? 'border-red-400/60 bg-red-500/10 text-red-600 dark:text-red-400'
          : 'border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/40'
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full shrink-0 transition-colors',
          active ? 'bg-red-500' : 'bg-muted-foreground/40'
        )}
      />
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  slot: MyInterviewSlot | null;
  onOpenChange: (open: boolean) => void;
}

export function EvaluationSheet({ slot, onOpenChange }: Props) {
  const [scores, setScores] = useState<EvaluationScores>({ ...DEFAULT_SCORES });
  const [flags, setFlags] = useState<EvaluationFlags>({ ...DEFAULT_FLAGS });
  const [observacoes, setObservacoes] = useState('');
  const mutation = SelectionProcessRepository.useSubmitEvaluation();

  const open = slot !== null;
  const allScored = SCORE_KEY_ORDER.every((k) => scores[k] > 0);
  const filledCount = SCORE_KEY_ORDER.filter((k) => scores[k] > 0).length;
  const activeFlags = FLAG_KEYS.filter((k) => flags[k]);

  function handleClose() {
    setScores({ ...DEFAULT_SCORES });
    setFlags({ ...DEFAULT_FLAGS });
    setObservacoes('');
    onOpenChange(false);
  }

  function handleSubmit() {
    if (!slot?.booking_id || !allScored) return;
    mutation.mutate(
      {
        bookingId: slot.booking_id,
        payload: { ...scores, ...flags, observacoes: observacoes.trim() || undefined }
      },
      {
        onSuccess: () => {
          toast.success('Avaliação enviada com sucesso!');
          handleClose();
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side='right' className='w-full sm:max-w-xl flex flex-col p-0 gap-0'>
        {/* Fixed header */}
        <SheetHeader className='px-6 pt-6 pb-4 border-b shrink-0'>
          <SheetTitle>Avaliação de Entrevista</SheetTitle>
          <SheetDescription className='space-y-0'>
            {slot?.candidate_name && (
              <span className='block font-medium text-foreground text-sm'>
                {slot.candidate_name}
              </span>
            )}
            {slot && <span className='block capitalize text-xs'>{fmtDate(slot.starts_at)}</span>}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div className='flex-1 overflow-y-auto px-6 py-5 space-y-8'>
          {/* Scores */}
          {SCORE_GROUPS.map((group) => (
            <section key={group.label}>
              <div className='flex items-center justify-between mb-4'>
                <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  {group.label}
                </h4>
                <span className='text-xs text-muted-foreground'>
                  {group.keys.filter((k) => scores[k] > 0).length}/{group.keys.length}
                </span>
              </div>
              <div className='space-y-4'>
                {group.keys.map((key) => (
                  <ScoreSelector
                    key={key}
                    label={SCORE_LABELS[key]}
                    value={scores[key]}
                    onChange={(v) => setScores((prev) => ({ ...prev, [key]: v }))}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* Red flags */}
          <section>
            <div className='mb-3'>
              <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Pontos de Atenção
              </h4>
              <p className='text-xs text-muted-foreground mt-1'>
                Marque comportamentos negativos observados durante a entrevista.
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              {FLAG_KEYS.map((key) => (
                <FlagChip
                  key={key}
                  label={FLAG_LABELS[key]}
                  active={flags[key]}
                  onChange={(v) => setFlags((prev) => ({ ...prev, [key]: v }))}
                />
              ))}
            </div>
            {activeFlags.length > 0 && (
              <p className='text-xs text-red-600 dark:text-red-400 mt-2.5'>
                {activeFlags.length} ponto{activeFlags.length !== 1 ? 's' : ''} sinalizado
                {activeFlags.length !== 1 ? 's' : ''}
              </p>
            )}
          </section>

          {/* Notes */}
          <section>
            <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
              Observações
            </h4>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
              placeholder='Comentários adicionais sobre o candidato (opcional)…'
              className='w-full resize-none rounded-xl border bg-background px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
            />
          </section>
        </div>

        {/* Sticky footer */}
        <div className='border-t px-6 py-4 bg-background shrink-0 space-y-2.5'>
          {/* Progress bar */}
          <div>
            <div className='flex justify-between text-xs text-muted-foreground mb-1.5'>
              <span>Progresso</span>
              <span>{filledCount}/12 critérios avaliados</span>
            </div>
            <div className='h-1.5 rounded-full bg-muted overflow-hidden'>
              <div
                className='h-full rounded-full bg-primary transition-all duration-300'
                style={{ width: `${(filledCount / 12) * 100}%` }}
              />
            </div>
          </div>

          <Button
            className='w-full'
            disabled={!allScored || mutation.isPending}
            onClick={handleSubmit}
          >
            {mutation.isPending ? (
              <>
                <Icons.spinner className='mr-2 size-4 animate-spin' />
                Enviando…
              </>
            ) : !allScored ? (
              `Avalie todos os ${12 - filledCount} critério${12 - filledCount !== 1 ? 's' : ''} restante${12 - filledCount !== 1 ? 's' : ''}`
            ) : (
              <>
                <Icons.check className='mr-2 size-4' />
                Enviar Avaliação
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
