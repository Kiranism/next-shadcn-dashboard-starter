'use client';

import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { CandidateCard, CandidateSheet } from './candidate-card';
import type { CandidateInterviewInfo } from './candidate-card';
import type { Candidate } from '@/types/selection-process';

export function CandidatesTab() {
  const { rank } = useUserProfile();
  const canEdit = rank >= 3;

  const [selectedProcessId, setSelectedProcessId] = useState<string | undefined>(undefined);
  const [selectedStageId, setSelectedStageId] = useState<string | undefined>(undefined);
  const [sheetCandidate, setSheetCandidate] = useState<Candidate | null>(null);

  const { data: processes } = SelectionProcessRepository.useProcesses();
  // All stages for the name lookup map (always loaded)
  const { data: allStages } = SelectionProcessRepository.useAllStages();
  // Process-specific stages for the filter dropdown
  const { data: filterStages } = SelectionProcessRepository.useStages(selectedProcessId ?? '');
  const { data: candidates, isLoading } = SelectionProcessRepository.useCandidates(
    selectedProcessId,
    selectedStageId
  );
  // Slots are cached from the interviews tab — just a cache hit for admins
  const { data: slots } = SelectionProcessRepository.useMyInterviewSlots();

  const stageMap = useMemo(() => new Map((allStages ?? []).map((s) => [s.id, s])), [allStages]);

  // Build interview info for all users from their own slots.
  // Admins see all slots so they get complete interviewer lists;
  // rank=0 consultants see only their own slot + pair_name from the API.
  const { interviewInfoByEmail } = useMemo(() => {
    if (!slots) {
      return {
        interviewInfoByEmail: new Map<string, CandidateInterviewInfo>()
      };
    }
    const byBookingId = new Map<string, typeof slots>();
    for (const s of slots) {
      if (!s.booking_id || !s.candidate_email) continue;
      if (!byBookingId.has(s.booking_id)) byBookingId.set(s.booking_id, []);
      byBookingId.get(s.booking_id)!.push(s);
    }
    const interviewInfoByEmail = new Map<string, CandidateInterviewInfo>();
    for (const slotGroup of byBookingId.values()) {
      const first = slotGroup[0];
      if (!first.candidate_email) continue;
      const interviewerSet = new Set<string>();
      for (const s of slotGroup) {
        if (s.consultant_name) interviewerSet.add(s.consultant_name);
        if (s.pair_name) interviewerSet.add(s.pair_name);
      }
      interviewInfoByEmail.set(first.candidate_email, {
        startsAt: first.starts_at,
        endsAt: first.ends_at,
        interviewers: [...interviewerSet]
      });
    }
    return { interviewInfoByEmail };
  }, [slots]);

  const sortedFilterStages = [...(filterStages ?? [])].sort((a, b) => a.position - b.position);

  function getStageLabel(stageId: string | null): string | undefined {
    if (!stageId) return undefined;
    const stage = stageMap.get(stageId);
    if (!stage) return undefined;
    return `Etapa ${stage.position} — ${stage.name}`;
  }

  function handleProcessChange(value: string) {
    setSelectedProcessId(value === '__all__' ? undefined : value);
    setSelectedStageId(undefined);
  }

  const sheetStageName = sheetCandidate
    ? getStageLabel(sheetCandidate.current_stage_id)
    : undefined;

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='flex flex-wrap gap-2'>
          <Skeleton className='h-8 w-48 rounded-lg' />
          <Skeleton className='h-8 w-40 rounded-lg' />
        </div>
        <div className='grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className='aspect-[3/4] w-full rounded-xl' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='flex flex-wrap items-center gap-2'>
        <Select value={selectedProcessId ?? '__all__'} onValueChange={handleProcessChange}>
          <SelectTrigger className='h-8 w-auto min-w-48 text-sm'>
            <SelectValue placeholder='Todos os processos' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__all__'>Todos os processos</SelectItem>
            {(processes ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedStageId ?? '__all__'}
          onValueChange={(v) => setSelectedStageId(v === '__all__' ? undefined : v)}
          disabled={!selectedProcessId}
        >
          <SelectTrigger className='h-8 w-auto min-w-40 text-sm'>
            <SelectValue placeholder='Todas as etapas' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__all__'>Todas as etapas</SelectItem>
            {sortedFilterStages.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                Etapa {s.position} — {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {!candidates || candidates.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center'>
          <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
            <Icons.usersGroup className='size-5 text-muted-foreground' />
          </div>
          <div>
            <p className='font-medium'>Nenhum candidato</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {selectedProcessId
                ? 'Não há candidatos para o filtro selecionado.'
                : 'Nenhum candidato registrado ainda.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className='text-xs text-muted-foreground font-medium'>
            {candidates.length} candidato{candidates.length !== 1 ? 's' : ''}
          </p>
          <div className='grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'>
            {candidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                currentStageName={getStageLabel(c.current_stage_id)}
                canEdit={canEdit}
                interviewStartsAt={interviewInfoByEmail.get(c.email)?.startsAt}
                canShowInterviewStatus={canEdit || interviewInfoByEmail.has(c.email)}
                onOpen={() => setSheetCandidate(c)}
              />
            ))}
          </div>
        </>
      )}

      <CandidateSheet
        candidate={sheetCandidate}
        currentStageName={sheetStageName}
        interviewInfo={sheetCandidate ? interviewInfoByEmail.get(sheetCandidate.email) : undefined}
        open={!!sheetCandidate}
        onOpenChange={(open) => {
          if (!open) setSheetCandidate(null);
        }}
        canEdit={canEdit}
      />
    </div>
  );
}
