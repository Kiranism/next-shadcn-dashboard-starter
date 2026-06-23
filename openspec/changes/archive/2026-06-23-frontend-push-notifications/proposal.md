## Why

O backend já suporta Web Push via VAPID, mas o frontend ainda não registra Service Workers nem subscrições — usuários perdem notificações de atividades agendadas quando a aba está fechada ou em background. Este recurso permite que o browser entregue notificações mesmo com o app fechado, completando o ciclo de notificações da plataforma.

## What Changes

- Novo arquivo `public/sw.js` — Service Worker que escuta eventos `push` e exibe notificações nativas do browser; trata `notificationclick` para abrir/focar o app
- Nova camada de API `push-subscriptions` — tipos, serviço e queries para os endpoints `GET /push-subscriptions/vapid-public-key`, `POST /push-subscriptions` e `DELETE /push-subscriptions/:id`
- Novo hook `usePushNotifications` — encapsula registro, cancelamento e estado da permissão do browser
- Integração no layout autenticado — chama `registerPushNotifications` após o Clerk confirmar sessão ativa
- Evento `pushsubscriptionchange` no Service Worker — reenvia subscrição renovada automaticamente ao backend

## Capabilities

### New Capabilities

- `push-notifications`: Registro de Service Worker, obtenção de PushSubscription via VAPID, envio ao backend e exibição de notificações nativas do browser mesmo com o app fechado

### Modified Capabilities

<!-- Nenhuma spec existente muda seus requisitos. A `notification-center` continua funcionando via polling independente. -->

## Impact

- **Novo arquivo estático**: `public/sw.js` (precisa estar na raiz para ter scope `/`)
- **Nova feature folder**: `features/push-notifications/` com `api/types.ts`, `api/service.ts`, `api/queries.ts` e `hooks/use-push-notifications.ts`
- **Layout autenticado**: ponto de entrada para chamar o registro após login — sem mudança de UI
- **Dependências**: nenhuma biblioteca nova; usa browser APIs nativas (`ServiceWorkerRegistration`, `PushManager`, `Notification`)
- **Compatibilidade**: Safari ≥ 16.4 (com limitações), Chrome/Edge/Firefox com suporte completo; feature-detect antes de registrar
