## 1. Service Worker

- [x] 1.1 Criar `public/sw.js` com listener `push` que chama `self.registration.showNotification(title, { body, icon: '/favicon/web-app-manifest-192x192.png' })`
- [x] 1.2 Adicionar listener `notificationclick` no SW que foca janela existente ou abre `/` se nenhuma estiver aberta
- [x] 1.3 Adicionar listener `pushsubscriptionchange` no SW que re-subscreve com `event.oldSubscription.options` e envia os novos dados ao backend via `fetch POST /push-subscriptions` com token do `localStorage`
- [x] 1.4 Adicionar header `Cache-Control: no-store` para `/sw.js` em `next.config.ts` (via `headers()`)

## 2. Camada de API

- [x] 2.1 Criar `src/features/push-notifications/api/types.ts` com tipos `VapidPublicKeyResponse`, `PushSubscriptionPayload` e `PushSubscriptionResponse`
- [x] 2.2 Criar `src/features/push-notifications/api/service.ts` com `getVapidPublicKey()`, `createPushSubscription(payload)` e `deletePushSubscription(id)`
- [x] 2.3 Criar `src/features/push-notifications/api/queries.ts` com `pushNotificationKeys` factory e `useVapidPublicKeyQuery()`

## 3. Hook principal

- [x] 3.1 Criar `src/features/push-notifications/hooks/use-push-notifications.ts` com funções utilitárias `urlBase64ToUint8Array` e `arrayBufferToBase64Url`
- [x] 3.2 Implementar `registerPush()` no hook: verifica suporte (`serviceWorker` + `PushManager`), pede permissão, registra SW, busca chave VAPID, cria subscrição, envia ao backend e salva ID em `localStorage`
- [x] 3.3 Implementar `unregisterPush()` no hook: cancela subscrição no browser, chama `DELETE /push-subscriptions/:id` com ID do `localStorage`, limpa `localStorage`
- [x] 3.4 Tratar silenciosamente respostas 409 (já registrado) em `registerPush()` e 404 (já removido) em `unregisterPush()`
- [x] 3.5 Expor estado `permission: NotificationPermission` e `isSubscribed: boolean` no retorno do hook

## 4. Integração no layout

- [x] 4.1 Chamar `usePushNotifications` em `src/app/dashboard/layout.tsx` (ou em um Client Component filho dedicado) e invocar `registerPush()` via `useEffect` na montagem

## 5. Validação

- [ ] 5.1 Confirmar no DevTools (Application → Service Workers) que o SW está registrado e ativo
- [ ] 5.2 Confirmar no DevTools (Application → Push Messaging) que uma notificação de teste é exibida
- [ ] 5.3 Confirmar que `POST /push-subscriptions` é chamado e retorna 201 ou 409 na primeira carga após login
- [ ] 5.4 Confirmar que notificação é exibida com o app em background (aba minimizada ou tela bloqueada)
