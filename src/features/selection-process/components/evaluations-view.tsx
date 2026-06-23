'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { cn } from '@/lib/utils';
import type {
  InterviewEvaluationWithCandidate,
  EvaluationScores,
  EvaluationFlags
} from '@/types/selection-process';

// ─── Config ───────────────────────────────────────────────────────────────────

const TZ = 'America/Sao_Paulo';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ
  });
}

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

const FLAG_LABELS: Record<keyof EvaluationFlags, string> = {
  procrastinacao: 'Procrastinação',
  desinteresse: 'Desinteresse',
  falta_de_transparencia: 'Falta de Transparência',
  proposito_vago: 'Propósito Vago',
  vitimizacao: 'Vitimização',
  falta_de_confianca: 'Falta de Confiança'
};

const FLAG_KEYS: (keyof EvaluationFlags)[] = [
  'procrastinacao',
  'desinteresse',
  'falta_de_transparencia',
  'proposito_vago',
  'vitimizacao',
  'falta_de_confianca'
];

const SCORE_KEYS: (keyof EvaluationScores)[] = [
  'proatividade',
  'lideranca',
  'transparencia',
  'uniao_de_time',
  'comunicacao',
  'seriedade',
  'compromisso',
  'proposito',
  'autoresponsabilidade',
  'autoconfianca',
  'responsabilidade_social',
  'criatividade'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAverage(ev: InterviewEvaluationWithCandidate): number {
  const sum = SCORE_KEYS.reduce((acc, k) => acc + ev[k], 0);
  return sum / SCORE_KEYS.length;
}

function countFlags(ev: InterviewEvaluationWithCandidate): number {
  return FLAG_KEYS.filter((k) => ev[k]).length;
}

function avgColor(avg: number): string {
  if (avg >= 4.5) return 'text-emerald-600 dark:text-emerald-400';
  if (avg >= 3.5) return 'text-lime-600 dark:text-lime-400';
  if (avg >= 2.5) return 'text-yellow-600 dark:text-yellow-400';
  if (avg >= 1.5) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function avgBg(avg: number): string {
  if (avg >= 4.5) return 'bg-emerald-500';
  if (avg >= 3.5) return 'bg-lime-500';
  if (avg >= 2.5) return 'bg-yellow-400';
  if (avg >= 1.5) return 'bg-orange-500';
  return 'bg-red-500';
}

function scoreBarColor(score: number): string {
  if (score >= 5) return 'bg-emerald-500';
  if (score >= 4) return 'bg-lime-500';
  if (score >= 3) return 'bg-yellow-400';
  if (score >= 2) return 'bg-orange-500';
  return 'bg-red-500';
}

// ─── Score Detail ─────────────────────────────────────────────────────────────

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className='flex items-center gap-3'>
      <span className='text-xs text-muted-foreground w-36 shrink-0'>{label}</span>
      <div className='flex-1 h-2 rounded-full bg-muted overflow-hidden'>
        <div
          className={cn('h-full rounded-full transition-all', scoreBarColor(value))}
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className='text-xs font-bold w-4 text-right tabular-nums'>{value}</span>
    </div>
  );
}

// ─── Evaluation Card ──────────────────────────────────────────────────────────

function EvaluationCard({ evaluation }: { evaluation: InterviewEvaluationWithCandidate }) {
  const [expanded, setExpanded] = useState(false);
  const avg = useMemo(() => calcAverage(evaluation), [evaluation]);
  const flagCount = useMemo(() => countFlags(evaluation), [evaluation]);
  const activeFlags = FLAG_KEYS.filter((k) => evaluation[k]);

  return (
    <div className='rounded-xl border bg-card overflow-hidden'>
      {/* Summary row */}
      <button
        className='w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors'
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* Avatar */}
        <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-sm uppercase'>
          {evaluation.candidate_name.charAt(0)}
        </div>

        {/* Main info */}
        <div className='flex-1 min-w-0'>
          <p className='font-semibold text-sm truncate'>{evaluation.candidate_name}</p>
          <p className='text-xs text-muted-foreground mt-0.5'>{fmtDate(evaluation.created_at)}</p>
        </div>

        {/* Score + flags */}
        <div className='flex items-center gap-3 shrink-0'>
          {flagCount > 0 && (
            <div className='flex items-center gap-1 text-xs text-red-500'>
              <Icons.warning className='size-3.5' />
              <span className='font-medium'>{flagCount}</span>
            </div>
          )}
          <div className='text-right'>
            <div className={cn('text-lg font-bold tabular-nums leading-none', avgColor(avg))}>
              {avg.toFixed(1)}
            </div>
            <div className='text-[0.6rem] text-muted-foreground leading-none mt-0.5'>/5</div>
          </div>

          {/* Mini bar */}
          <div className='w-1.5 h-8 rounded-full bg-muted overflow-hidden'>
            <div
              className={cn('w-full rounded-full transition-all', avgBg(avg))}
              style={{ height: `${(avg / 5) * 100}%`, marginTop: 'auto' }}
            />
          </div>

          <Icons.chevronDown
            className={cn(
              'size-4 text-muted-foreground transition-transform shrink-0',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className='px-4 pb-5 space-y-6 border-t pt-4'>
          {SCORE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className='text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
                {group.label}
              </p>
              <div className='space-y-2.5'>
                {group.keys.map((key) => (
                  <ScoreRow key={key} label={SCORE_LABELS[key]} value={evaluation[key]} />
                ))}
              </div>
            </div>
          ))}

          {/* Flags */}
          {activeFlags.length > 0 && (
            <div>
              <p className='text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
                Pontos de Atenção
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {activeFlags.map((key) => (
                  <Badge
                    key={key}
                    variant='outline'
                    className='text-xs border-red-300 text-red-600 dark:border-red-800 dark:text-red-400'
                  >
                    {FLAG_LABELS[key]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {evaluation.observacoes && (
            <div>
              <p className='text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
                Observações
              </p>
              <p className='text-sm text-muted-foreground bg-muted/40 rounded-lg px-3.5 py-3 leading-relaxed'>
                {evaluation.observacoes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────

export function EvaluationsView() {
  const [selectedProcessId, setSelectedProcessId] = useState<string | undefined>(undefined);
  const { data: processes } = SelectionProcessRepository.useProcesses();
  const { data: evaluations, isLoading } =
    SelectionProcessRepository.useEvaluations(selectedProcessId);

  const sorted = useMemo(
    () => [...(evaluations ?? [])].sort((a, b) => calcAverage(b) - calcAverage(a)),
    [evaluations]
  );

  const avgOverall = useMemo(
    () =>
      sorted.length > 0 ? sorted.reduce((acc, e) => acc + calcAverage(e), 0) / sorted.length : 0,
    [sorted]
  );

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-9 w-52 rounded-lg' />
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-20 w-full rounded-xl' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h3 className='font-semibold'>Avaliações de Entrevista</h3>
          {sorted.length > 0 && (
            <p className='text-xs text-muted-foreground mt-0.5'>
              {sorted.length} avaliação{sorted.length !== 1 ? 'ões' : ''} ·{' '}
              <span className={cn('font-medium', avgColor(avgOverall))}>
                média {avgOverall.toFixed(2)}/5
              </span>
            </p>
          )}
        </div>

        {/* Process filter */}
        <Select
          value={selectedProcessId ?? 'all'}
          onValueChange={(v) => setSelectedProcessId(v === 'all' ? undefined : v)}
        >
          <SelectTrigger className='w-52 h-8 text-xs'>
            <SelectValue placeholder='Todos os processos' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos os processos</SelectItem>
            {(processes ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {sorted.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center'>
          <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
            <Icons.forms className='size-5 text-muted-foreground' />
          </div>
          <div>
            <p className='font-medium'>Nenhuma avaliação encontrada</p>
            <p className='text-sm text-muted-foreground mt-0.5'>
              {selectedProcessId
                ? 'Nenhuma avaliação para este processo seletivo.'
                : 'As avaliações aparecerão aqui após as entrevistas.'}
            </p>
          </div>
          {selectedProcessId && (
            <Button size='sm' variant='outline' onClick={() => setSelectedProcessId(undefined)}>
              Ver todos os processos
            </Button>
          )}
        </div>
      ) : (
        <div className='space-y-2.5'>
          {sorted.map((ev) => (
            <EvaluationCard key={ev.id} evaluation={ev} />
          ))}
        </div>
      )}
    </div>
  );
}
