## MODIFIED Requirements

### Requirement: Service Worker registrado e escutando push
O app SHALL registrar `public/sw.js` como Service Worker com escopo `/` na inicialização do layout autenticado, somente se `'serviceWorker' in navigator`, `'PushManager' in window` E `'Notification' in window`. O SW SHALL escutar o evento `push` e exibir uma notificação nativa com `title` e `body` extraídos do payload JSON.

#### Scenario: Browser com suporte completo a push — SW registrado
- **WHEN** o usuário abre o app em browser com suporte a `PushManager`, `ServiceWorker` e `Notification`
- **THEN** `navigator.serviceWorker.register('/sw.js')` SHALL ser chamado e o SW SHALL estar ativo

#### Scenario: Browser sem suporte a push — sem registro e sem erro
- **WHEN** o usuário abre o app em browser onde qualquer uma das APIs (`serviceWorker`, `PushManager`, `Notification`) está ausente (ex: Safari < 16.4, Firefox modo privado)
- **THEN** nenhuma tentativa de registro SHALL ocorrer, nenhum erro SHALL ser lançado e o app SHALL funcionar normalmente sem push

#### Scenario: Exceção durante registro — capturada silenciosamente
- **WHEN** `navigator.serviceWorker.register('/sw.js')` lança uma exceção (ex: contexto não seguro, HTTPS ausente)
- **THEN** o erro SHALL ser capturado via try/catch, logado em console.warn em desenvolvimento, e o fluxo do app SHALL continuar sem interrupção

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
Após o login, o hook `usePushNotifications` SHALL verificar suporte das APIs antes de solicitar permissão. Se suportado, SHALL solicitar permissão de notificação ao usuário via `Notification.requestPermission()`, buscar a chave pública VAPID em `GET /push-subscriptions/vapid-public-key` e criar uma `PushSubscription` via `swReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.

#### Scenario: Browser sem suporte — hook encerra sem ação
- **WHEN** `usePushNotifications` é chamado em browser sem suporte a `Notification` ou `PushManager`
- **THEN** o hook SHALL retornar imediatamente sem chamar nenhuma API e sem lançar exceção

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
