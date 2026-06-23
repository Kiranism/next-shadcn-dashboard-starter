export interface VapidPublicKeyResponse {
  vapid_public_key: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionResponse {
  id: string;
}
