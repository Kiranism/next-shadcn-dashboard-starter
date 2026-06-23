## ADDED Requirements

### Requirement: Service Worker registrado e escutando push
O app SHALL registrar `public/sw.js` como Service Worker com escopo `/` na inicialização do layout autenticado, somente se `'serviceWorker' in navigator` e `'PushManager' in window`. O SW SHALL escutar o evento `push` e exibir uma notificação nativa com `title` e `body` extraídos do payload JSON.

#### Scenario: Browser com suporte a push — SW registrado
- **WHEN** o usuário abre o app em browser com suporte a `PushManager`
- **THEN** `navigator.serviceWorker.register('/sw.js')` SHALL ser chamado e o SW SHALL estar ativo

#### Scenario: Browser sem suporte a push — sem registro
- **WHEN** o usuário abre o app em browser onde `'PushManager' in window` é `false` (ex: Safari < 16.4)
- **THEN** nenhuma tentativa de registro SHALL ocorrer e nenhum erro SHALL ser lançado

#### Scenario: Push recebido com título e body
- **WHEN** o SW recebe um evento `push` com payload `{ "title": "...", "body": "..." }`
- **THEN** `self.registration.showNotification` SHALL ser chamado com o `title` e `body` do payload

#### Scenario: Push recebido sem body
- **WHEN** o SW recebe um evento `push` com payload `{ "title": "Atividade agendada" }` sem `body`
- **THEN** a notificação SHALL ser exibida com `body` vazio (string vazia ou omitido)

#### Scenario: Clique na notificação abre o app
- **WHEN** o usuário clica na notificação nativa
- **THEN** o SW SHALL focar uma janela existente do app, ou abrir uma nova janela na URL raiz `/` se nenhuma estiver aberta

### Requirement: Solicitação de permissão e subscrição VAPID
Após o login, o hook `usePushNotifications` SHALL solicitar permissão de notificação ao usuário via `Notification.requestPermission()`, buscar a chave pública VAPID em `GET /push-subscriptions/vapid-public-key` e criar uma `PushSubscription` via `swReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.

#### Scenario: Usuário concede permissão — subscrição criada
- **WHEN** `Notification.requestPermission()` retorna `'granted'`
- **THEN** o hook SHALL criar a `PushSubscription` no browser e enviar `endpoint`, `p256dh` e `auth` via `POST /push-subscriptions`

#### Scenario: Usuário nega permissão — sem subscrição
- **WHEN** `Notification.requestPermission()` retorna `'denied'`
- **THEN** o hook SHALL interromper o fluxo sem chamar a API e sem exibir erros ao usuário

#### Scenario: Permissão já concedida em sessão anterior — reutiliza subscrição
- **WHEN** `Notification.permission === 'granted'` e `swReg.pushManager.getSubscription()` retorna subscrição existente
- **THEN** o hook SHALL enviar os dados ao backend sem solicitar nova permissão ao usuário

#### Scenario: Backend retorna 409 — subscrição já registrada
- **WHEN** `POST /push-subscriptions` retorna HTTP 409
- **THEN** o hook SHALL ignorar o erro silenciosamente (subscrição já ativa)

### Requirement: Persistência do ID de subscrição para cancelamento
Após `POST /push-subscriptions` retornar `{ "id": "uuid" }` com status 201, o hook SHALL salvar o `id` em `localStorage` sob a chave `push_subscription_id`.

#### Scenario: ID salvo após registro bem-sucedido
- **WHEN** `POST /push-subscriptions` retorna `{ "id": "abc-123" }` com status 201
- **THEN** `localStorage.getItem('push_subscription_id')` SHALL retornar `'abc-123'`

#### Scenario: ID ausente — cancelamento sem chamada ao backend
- **WHEN** `localStorage.getItem('push_subscription_id')` retorna `null` e `unregisterPush` é chamado
- **THEN** o browser SHALL cancelar a subscrição local (`subscription.unsubscribe()`) mas nenhuma chamada a `DELETE /push-subscriptions/:id` SHALL ocorrer

### Requirement: Cancelamento de subscrição push
O hook SHALL expor uma função `unregisterPush` que cancela a subscrição no browser e envia `DELETE /push-subscriptions/:id` ao backend, usando o ID salvo em `localStorage`.

#### Scenario: Cancelamento bem-sucedido
- **WHEN** `unregisterPush` é chamado com `push_subscription_id` presente no `localStorage`
- **THEN** `subscription.unsubscribe()` SHALL ser chamado e `DELETE /push-subscriptions/:id` SHALL retornar 204, removendo o ID do `localStorage`

#### Scenario: Backend retorna 404 ao cancelar — tratar como sucesso
- **WHEN** `DELETE /push-subscriptions/:id` retorna 404
- **THEN** o hook SHALL remover o ID do `localStorage` sem exibir erro (subscrição já removida)

### Requirement: Renovação automática de subscrição (pushsubscriptionchange)
O Service Worker SHALL escutar o evento `pushsubscriptionchange` e reenviar a nova subscrição ao backend via `fetch POST /push-subscriptions` usando o token de autenticação disponível em `localStorage`.

#### Scenario: Browser renova subscrição automaticamente
- **WHEN** o browser dispara `pushsubscriptionchange` com uma nova subscrição
- **THEN** o SW SHALL chamar `self.registration.pushManager.subscribe(event.oldSubscription.options)` e enviar os novos dados ao backend via `POST /push-subscriptions`
