import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiPut } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import type {
  SelectionProcess,
  SelectionProcessApplication,
  Stage,
  Candidate,
  CreateSelectionProcessPayload,
  UpdateSelectionProcessPayload,
  UpdateApplicationStatusPayload,
  CreateStagePayload,
  UpdateStagePayload,
  UpdateCandidatePayload,
  InterviewSlot,
  InterviewBookingDetail,
  MyInterviewSlot,
  AddInterviewSlotsPayload,
  SendInterviewLinksPayload,
  SendInterviewLinksResult,
  SendMeetLinkPayload,
  CreateEvaluationPayload,
  InterviewEvaluationResponse,
  InterviewEvaluationWithCandidate
} from '@/types/selection-process';

export const selectionProcessKeys = {
  all: () => ['selection-process'] as const,
  processes: () => ['selection-process', 'processes'] as const,
  applications: (processId?: string) =>
    processId
      ? (['selection-process', 'applications', processId] as const)
      : (['selection-process', 'applications'] as const),
  stages: (processId?: string) =>
    processId
      ? (['selection-process', 'stages', processId] as const)
      : (['selection-process', 'stages'] as const),
  candidates: (processId?: string, stageId?: string) =>
    processId && stageId
      ? (['selection-process', 'candidates', processId, stageId] as const)
      : processId
        ? (['selection-process', 'candidates', processId] as const)
        : (['selection-process', 'candidates'] as const),
  interviewSlots: () => ['selection-process', 'interviews', 'slots'] as const,
  evaluations: (processId?: string) =>
    processId
      ? (['selection-process', 'interviews', 'evaluations', processId] as const)
      : (['selection-process', 'interviews', 'evaluations'] as const)
};

// ─── Processes ───────────────────────────────────────────────────────────────

async function getProcesses(token: string): Promise<SelectionProcess[]> {
  return apiGet<SelectionProcess[]>('/selection-process', token);
}

async function createProcess(
  token: string,
  payload: CreateSelectionProcessPayload
): Promise<SelectionProcess> {
  return apiPost<SelectionProcess>('/selection-process', token, payload);
}

async function updateProcess(
  token: string,
  processId: string,
  payload: UpdateSelectionProcessPayload
): Promise<SelectionProcess> {
  return apiPatch<SelectionProcess>(`/selection-process/${processId}`, token, payload);
}

function useProcesses() {
  const token = useAccessToken();
  return useQuery({
    queryKey: selectionProcessKeys.processes(),
    queryFn: () => getProcesses(token),
    enabled: !!token
  });
}

function useCreateProcess() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSelectionProcessPayload) => createProcess(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: selectionProcessKeys.processes() });
    }
  });
}

function useUpdateProcess() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      payload
    }: {
      processId: string;
      payload: UpdateSelectionProcessPayload;
    }) => updateProcess(token, processId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: selectionProcessKeys.processes() });
    }
  });
}

// ─── Applications ─────────────────────────────────────────────────────────────

async function getApplications(
  token: string,
  processId?: string
): Promise<SelectionProcessApplication[]> {
  const url = processId
    ? `/selection-process/applications?selection_process_id=${processId}`
    : '/selection-process/applications';
  return apiGet<SelectionProcessApplication[]>(url, token);
}

async function updateApplicationStatus(
  token: string,
  applicationId: string,
  payload: UpdateApplicationStatusPayload
): Promise<SelectionProcessApplication> {
  return apiPatch<SelectionProcessApplication>(
    `/selection-process/applications/${applicationId}`,
    token,
    payload
  );
}

function useApplications(processId?: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: selectionProcessKeys.applications(processId),
    queryFn: () => getApplications(token, processId),
    enabled: !!token
  });
}

function useUpdateApplicationStatus() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      payload
    }: {
      applicationId: string;
      payload: UpdateApplicationStatusPayload;
    }) => updateApplicationStatus(token, applicationId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: selectionProcessKeys.applications() });
    }
  });
}

// ─── Stages ───────────────────────────────────────────────────────────────────

async function getStages(token: string, processId: string): Promise<Stage[]> {
  return apiGet<Stage[]>(`/selection-process/stages?selection_process_id=${processId}`, token);
}

async function getAllStages(token: string): Promise<Stage[]> {
  return apiGet<Stage[]>('/selection-process/stages', token);
}

async function createStage(token: string, payload: CreateStagePayload): Promise<Stage> {
  return apiPost<Stage>('/selection-process/stages', token, payload);
}

async function updateStage(
  token: string,
  stageId: string,
  payload: UpdateStagePayload
): Promise<Stage> {
  return apiPut<Stage>(`/selection-process/stages/${stageId}`, token, payload);
}

function useStages(processId: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: selectionProcessKeys.stages(processId),
    queryFn: () => getStages(token, processId),
    enabled: !!token && !!processId
  });
}

function useAllStages() {
  const token = useAccessToken();
  return useQuery({
    queryKey: selectionProcessKeys.stages(),
    queryFn: () => getAllStages(token),
    enabled: !!token
  });
}

function useCreateStage() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStagePayload) => createStage(token, payload),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: selectionProcessKeys.stages(variables.selection_process_id)
      });
    }
  });
}

function useUpdateStage(processId: string) {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, payload }: { stageId: string; payload: UpdateStagePayload }) =>
      updateStage(token, stageId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: selectionProcessKeys.stages(processId) });
    }
  });
}

// ─── Candidates ───────────────────────────────────────────────────────────────

async function getCandidates(
  token: string,
  processId?: string,
  stageId?: string
): Promise<Candidate[]> {
  const params = new URLSearchParams();
  if (processId) params.set('selection_process_id', processId);
  if (stageId) params.set('stage_id', stageId);
  const qs = params.toString();
  return apiGet<Candidate[]>(
    qs ? `/selection-process/candidates?${qs}` : '/selection-process/candidates',
    token
  );
}

async function updateCandidate(
  token: string,
  candidateId: string,
  payload: UpdateCandidatePayload
): Promise<Candidate> {
  return apiPatch<Candidate>(`/selection-process/candidates/${candidateId}`, token, payload);
}

function useCandidates(processId?: string, stageId?: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: selectionProcessKeys.candidates(processId, stageId),
    queryFn: () => getCandidates(token, processId, stageId),
    enabled: !!token
  });
}

function useUpdateCandidate() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      candidateId,
      payload
    }: {
      candidateId: string;
      payload: UpdateCandidatePayload;
    }) => updateCandidate(token, candidateId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: selectionProcessKeys.candidates() });
    }
  });
}

// ─── Interviews ───────────────────────────────────────────────────────────────

async function getMyInterviewSlots(token: string): Promise<MyInterviewSlot[]> {
  return apiGet<MyInterviewSlot[]>('/selection-process/interviews/slots', token);
}

async function addInterviewSlots(
  token: string,
  payload: AddInterviewSlotsPayload
): Promise<InterviewSlot[]> {
  return apiPost<InterviewSlot[]>('/selection-process/interviews', token, payload);
}

async function sendInterviewLinks(
  token: string,
  payload: SendInterviewLinksPayload
): Promise<SendInterviewLinksResult[]> {
  return apiPost<SendInterviewLinksResult[]>(
    '/selection-process/interviews/send-link',
    token,
    payload
  );
}

async function sendMeetLink(
  token: string,
  payload: SendMeetLinkPayload
): Promise<InterviewBookingDetail> {
  return apiPost<InterviewBookingDetail>('/selection-process/interviews/meet-link', token, payload);
}

async function submitEvaluation(
  token: string,
  bookingId: string,
  payload: CreateEvaluationPayload
): Promise<InterviewEvaluationResponse> {
  return apiPost<InterviewEvaluationResponse>(
    `/selection-process/interviews/${bookingId}/evaluation`,
    token,
    payload
  );
}

async function getEvaluations(
  token: string,
  processId?: string
): Promise<InterviewEvaluationWithCandidate[]> {
  const url = processId
    ? `/selection-process/interviews/evaluations?selection_process_id=${processId}`
    : '/selection-process/interviews/evaluations';
  return apiGet<InterviewEvaluationWithCandidate[]>(url, token);
}

function useMyInterviewSlots() {
  const token = useAccessToken();
  return useQuery({
    queryKey: selectionProcessKeys.interviewSlots(),
    queryFn: () => getMyInterviewSlots(token),
    enabled: !!token
  });
}

function useAddInterviewSlots() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddInterviewSlotsPayload) => addInterviewSlots(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: selectionProcessKeys.interviewSlots() });
    }
  });
}

function useSendInterviewLinks() {
  const token = useAccessToken();
  return useMutation({
    mutationFn: (payload: SendInterviewLinksPayload) => sendInterviewLinks(token, payload)
  });
}

function useSendMeetLink() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMeetLinkPayload) => sendMeetLink(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: selectionProcessKeys.interviewSlots() });
    }
  });
}

function useSubmitEvaluation() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload: CreateEvaluationPayload }) =>
      submitEvaluation(token, bookingId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: selectionProcessKeys.interviewSlots() });
      void qc.invalidateQueries({ queryKey: selectionProcessKeys.evaluations() });
    }
  });
}

function useEvaluations(processId?: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: selectionProcessKeys.evaluations(processId),
    queryFn: () => getEvaluations(token, processId),
    enabled: !!token
  });
}

export const SelectionProcessRepository = {
  keys: selectionProcessKeys,
  useProcesses,
  useCreateProcess,
  useUpdateProcess,
  useApplications,
  useUpdateApplicationStatus,
  useStages,
  useAllStages,
  useCreateStage,
  useUpdateStage,
  useCandidates,
  useUpdateCandidate,
  useMyInterviewSlots,
  useAddInterviewSlots,
  useSendInterviewLinks,
  useSendMeetLink,
  useSubmitEvaluation,
  useEvaluations
};
