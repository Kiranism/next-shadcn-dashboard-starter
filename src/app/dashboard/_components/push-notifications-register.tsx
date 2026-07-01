'use client';

import { useEffect } from 'react';
import { usePushNotifications } from '@/features/push-notifications/hooks/use-push-notifications';

export function PushNotificationsRegister() {
  const { registerPush } = usePushNotifications();

  useEffect(() => {
    void registerPush();
  }, [registerPush]);

  return null;
}
