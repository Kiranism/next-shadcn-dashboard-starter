import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import { useSession } from '@/components/providers/session-provider';
import type {
  House,
  HouseMember,
  AssignHouseMemberPayload,
  GamificationCycle,
  CreateCyclePayload,
  GamificationTask,
  CreateTaskPayload,
  UpdateTaskPayload,
  GamificationSubmission,
  CreateSubmissionPayload,
  ReviewSubmissionPayload,
  LeaderboardEntry,
  PodiumEntry
} from '@/types/gamification';

export const gamificationKeys = {
  all: () => ['gamification'] as const,
  leaderboard: (cycleId?: string) => ['gamification', 'leaderboard', cycleId ?? 'active'] as const,
  podium: (houseId: string, cycleId?: string) =>
    ['gamification', 'podium', houseId, cycleId ?? 'active'] as const,
  cycles: () => ['gamification', 'cycles'] as const,
  activeCycle: () => ['gamification', 'cycles', 'active'] as const,
  tasks: (includeInactive?: boolean) =>
    ['gamification', 'tasks', includeInactive ? 'all' : 'active'] as const,
  submissions: (filter?: string) => ['gamification', 'submissions', filter ?? 'me'] as const,
  houses: () => ['gamification', 'houses'] as const,
  houseMembers: (houseId: string) => ['gamification', 'houses', houseId, 'members'] as const
};

// ─── Houses ──────────────────────────────────────────────────────────────────

async function getHouses(token: string): Promise<House[]> {
  return apiGet<House[]>('/houses', token);
}

async function getHouseMembers(token: string, houseId: string): Promise<HouseMember[]> {
  return apiGet<HouseMember[]>(`/houses/${houseId}/members`, token);
}

async function assignHouseMember(
  token: string,
  userId: string,
  payload: AssignHouseMemberPayload
): Promise<HouseMember> {
  return apiPatch<HouseMember>(`/houses/members/${userId}`, token, payload);
}

function useHouses() {
  const token = useAccessToken();
  return useQuery({
    queryKey: gamificationKeys.houses(),
    queryFn: () => getHouses(token),
    enabled: !!token
  });
}

function useHouseMembers(houseId: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: gamificationKeys.houseMembers(houseId),
    queryFn: () => getHouseMembers(token, houseId),
    enabled: !!token && !!houseId
  });
}

function useAllHouseMembers(houseIds: string[]) {
  const token = useAccessToken();
  return useQueries({
    queries: houseIds.map((houseId) => ({
      queryKey: gamificationKeys.houseMembers(houseId),
      queryFn: () => getHouseMembers(token, houseId),
      enabled: !!token && !!houseId
    }))
  });
}

function useAssignHouseMember() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AssignHouseMemberPayload }) =>
      assignHouseMember(token, userId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: gamificationKeys.houses() });
    }
  });
}

// ─── Cycles ──────────────────────────────────────────────────────────────────

async function getCycles(token: string): Promise<GamificationCycle[]> {
  return apiGet<GamificationCycle[]>('/gamification/cycles', token);
}

async function getActiveCycle(token: string): Promise<GamificationCycle> {
  return apiGet<GamificationCycle>('/gamification/cycles/active', token);
}

async function createCycle(token: string, payload: CreateCyclePayload): Promise<GamificationCycle> {
  return apiPost<GamificationCycle>('/gamification/cycles', token, payload);
}

async function closeCycle(token: string, id: string): Promise<GamificationCycle> {
  return apiPatch<GamificationCycle>(`/gamification/cycles/${id}/close`, token, {});
}

function useCycles() {
  const token = useAccessToken();
  return useQuery({
    queryKey: gamificationKeys.cycles(),
    queryFn: () => getCycles(token),
    enabled: !!token
  });
}

function useActiveCycle() {
  const token = useAccessToken();
  return useQuery({
    queryKey: gamificationKeys.activeCycle(),
    queryFn: () => getActiveCycle(token),
    enabled: !!token,
    retry: false
  });
}

function useCreateCycle() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCyclePayload) => createCycle(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: gamificationKeys.all() });
    }
  });
}

function useCloseCycle() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => closeCycle(token, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: gamificationKeys.all() });
    }
  });
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

async function getTasks(token: string, includeInactive?: boolean): Promise<GamificationTask[]> {
  const url = includeInactive ? '/gamification/tasks?include_inactive=true' : '/gamification/tasks';
  return apiGet<GamificationTask[]>(url, token);
}

async function createTask(token: string, payload: CreateTaskPayload): Promise<GamificationTask> {
  return apiPost<GamificationTask>('/gamification/tasks', token, payload);
}

async function updateTask(
  token: string,
  id: string,
  payload: UpdateTaskPayload
): Promise<GamificationTask> {
  return apiPatch<GamificationTask>(`/gamification/tasks/${id}`, token, payload);
}

function useTasks(includeInactive?: boolean) {
  const token = useAccessToken();
  return useQuery({
    queryKey: gamificationKeys.tasks(includeInactive),
    queryFn: () => getTasks(token, includeInactive),
    enabled: !!token
  });
}

function useCreateTask() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: gamificationKeys.tasks() });
      void qc.invalidateQueries({ queryKey: gamificationKeys.tasks(true) });
    }
  });
}

function useUpdateTask() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      updateTask(token, id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: gamificationKeys.tasks() });
      void qc.invalidateQueries({ queryKey: gamificationKeys.tasks(true) });
    }
  });
}

// ─── Submissions ─────────────────────────────────────────────────────────────

async function getSubmissions(
  token: string,
  params?: { status?: string; userId?: string; target?: 'me' | 'all' }
): Promise<GamificationSubmission[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.userId) search.set('user_id', params.userId);
  const qs = search.toString();
  return apiGet<GamificationSubmission[]>(`/gamification/submissions${qs ? `?${qs}` : ''}`, token);
}

async function createSubmission(
  token: string,
  payload: CreateSubmissionPayload
): Promise<GamificationSubmission> {
  return apiPost<GamificationSubmission>('/gamification/submissions', token, payload);
}

async function reviewSubmission(
  token: string,
  id: string,
  payload: ReviewSubmissionPayload
): Promise<GamificationSubmission> {
  return apiPatch<GamificationSubmission>(`/gamification/submissions/${id}/review`, token, payload);
}

function useMySubmissions() {
  const token = useAccessToken();
  const { user } = useSession();
  return useQuery({
    queryKey: gamificationKeys.submissions('me'),
    queryFn: () => getSubmissions(token, { userId: user?.id }),
    enabled: !!token && !!user?.id,
    staleTime: 0
  });
}

function usePendingSubmissions() {
  const token = useAccessToken();
  return useQuery({
    queryKey: gamificationKeys.submissions('pending'),
    queryFn: () => getSubmissions(token, { status: 'pending' }),
    enabled: !!token,
    staleTime: 0
  });
}

function useCreateSubmission() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubmissionPayload) => createSubmission(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: gamificationKeys.submissions('me')
      });
    }
  });
}

function useReviewSubmission() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewSubmissionPayload }) =>
      reviewSubmission(token, id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: gamificationKeys.submissions('pending')
      });
      void qc.invalidateQueries({ queryKey: gamificationKeys.leaderboard() });
    }
  });
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

async function getLeaderboard(token: string, cycleId?: string): Promise<LeaderboardEntry[]> {
  const url = cycleId
    ? `/gamification/leaderboard?cycle_id=${cycleId}`
    : '/gamification/leaderboard';
  return apiGet<LeaderboardEntry[]>(url, token);
}

async function getPodium(token: string, houseId: string, cycleId?: string): Promise<PodiumEntry[]> {
  const params = new URLSearchParams({ house_id: houseId });
  if (cycleId) params.set('cycle_id', cycleId);
  return apiGet<PodiumEntry[]>(`/gamification/leaderboard/podium?${params.toString()}`, token);
}

function useLeaderboard(cycleId?: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: gamificationKeys.leaderboard(cycleId),
    queryFn: () => getLeaderboard(token, cycleId),
    enabled: !!token,
    retry: false
  });
}

function usePodium(houseId: string, cycleId?: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: gamificationKeys.podium(houseId, cycleId),
    queryFn: () => getPodium(token, houseId, cycleId),
    enabled: !!token && !!houseId,
    retry: false
  });
}

export const GamificationRepository = {
  keys: gamificationKeys,
  // houses
  useHouses,
  useHouseMembers,
  useAllHouseMembers,
  useAssignHouseMember,
  // cycles
  useCycles,
  useActiveCycle,
  useCreateCycle,
  useCloseCycle,
  // tasks
  useTasks,
  useCreateTask,
  useUpdateTask,
  // submissions
  useMySubmissions,
  usePendingSubmissions,
  useCreateSubmission,
  useReviewSubmission,
  // leaderboard
  useLeaderboard,
  usePodium
};
