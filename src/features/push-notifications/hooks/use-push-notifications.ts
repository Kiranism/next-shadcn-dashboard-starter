'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { ApiError } from '@/lib/api-client';
import { createPushSubscription, deletePushSubscription, getVapidPublicKey } from '../api/service';

const STORAGE_KEY = 'push_subscription_id';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function usePushNotifications() {
  const { session } = useSession();
  const token = session?.access_token ?? null;

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    if (typeof window !== 'undefined') {
      setIsSubscribed(!!localStorage.getItem(STORAGE_KEY));
    }
  }, []);

  // Respond to SW requests for auth config (needed by pushsubscriptionchange handler)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GET_PUSH_CONFIG' && event.ports[0]) {
        event.ports[0].postMessage({
          token,
          apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
        });
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [token]);

  const registerPush = useCallback(async () => {
    if (
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    )
      return;
    if (!token) return;

    let perm = Notification.permission;
    if (perm === 'denied') return;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
      setPermission(perm);
    }
    if (perm !== 'granted') return;

    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (err) {
      if (process.env.NODE_ENV !== 'production')
        console.warn('[push] SW registration failed:', err);
      return;
    }
    const swReg = await navigator.serviceWorker.ready;

    let subscription = await swReg.pushManager.getSubscription();

    if (!subscription) {
      const { vapid_public_key } = await getVapidPublicKey(token);
      subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid_public_key)
      });
    }

    const p256dh = arrayBufferToBase64Url(subscription.getKey('p256dh')!);
    const auth = arrayBufferToBase64Url(subscription.getKey('auth')!);

    try {
      const response = await createPushSubscription(token, {
        endpoint: subscription.endpoint,
        p256dh,
        auth
      });
      localStorage.setItem(STORAGE_KEY, response.id);
      setIsSubscribed(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setIsSubscribed(true);
        return;
      }
      throw err;
    }
  }, [token]);

  const unregisterPush = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    const swReg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (swReg) {
      const subscription = await swReg.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
    }

    const id = localStorage.getItem(STORAGE_KEY);
    if (id && token) {
      try {
        await deletePushSubscription(token, id);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) throw err;
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setIsSubscribed(false);
    if ('Notification' in window) setPermission(Notification.permission);
  }, [token]);

  return { registerPush, unregisterPush, permission, isSubscribed };
}
