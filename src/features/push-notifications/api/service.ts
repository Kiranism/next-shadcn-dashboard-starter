import { apiDelete, apiGet, apiPost } from '@/lib/api-client';
import type {
  PushSubscriptionPayload,
  PushSubscriptionResponse,
  VapidPublicKeyResponse
} from './types';

export async function getVapidPublicKey(token: string): Promise<VapidPublicKeyResponse> {
  return apiGet<VapidPublicKeyResponse>('/push-subscriptions/vapid-public-key', token);
}

export async function createPushSubscription(
  token: string,
  payload: PushSubscriptionPayload
): Promise<PushSubscriptionResponse> {
  return apiPost<PushSubscriptionResponse>('/push-subscriptions', token, payload);
}

export async function deletePushSubscription(token: string, id: string): Promise<void> {
  return apiDelete<void>(`/push-subscriptions/${id}`, token);
}
