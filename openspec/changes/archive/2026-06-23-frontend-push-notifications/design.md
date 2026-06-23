## Context

O backend expõe três endpoints VAPID:
- `GET /push-subscriptions/vapid-public-key` — público, retorna a chave pública
- `POST /push-subscriptions` — autenticado, registra subscrição do dispositivo
- `DELETE /push-subscriptions/:id` — autenticado, remove subscrição

O frontend é Next.js 16 com App Router. O Service Worker precisa estar em `public/sw.js` para ter scope `/` (raiz da origem). Clerk gerencia autenticação; o token Bearer já é injetado pelo cliente de API existente (`lib/api.ts`).

A `notification-center` já existe com polling a cada 60s — este recurso é ortogonal: entrega notificações fora de banda via browser push, sem substituir o polling in-app.

## Goals / Non-Goals

**Goals:**
- Registrar `public/sw.js` como Service Worker e exibir notificações nativas quando o evento `push` chegar
- Solicitar permissão ao usuário em momento oportuno (após login, não bloqueante)
- Enviar `PushSubscription` ao backend; silenciar 409 (já registrado)
- Permitir que o usuário desative push (cancelar subscrição no browser e no backend)
- Reenviar subscrição automaticamente se o browser a renovar (`pushsubscriptionchange`)

**Non-Goals:**
- UI de configurações de notificação (toggle on/off) — não faz parte deste escopo
- Notificações in-app ou toasts — já cobertos pela `notification-center`
- Suporte a Firefox para Android ou Safari < 16.4 — não garantido, degrada graciosamente
- Gerenciamento de múltiplos dispositivos do mesmo usuário — o backend já lida com isso

## Decisions

### D1 — Service Worker em `public/sw.js` (não gerado por next-pwa)

**Decisão**: arquivo estático manual em `public/sw.js`.

**Alternativa considerada**: `next-pwa` ou `@serwist/next` para gerar o SW com precaching.

**Razão**: o escopo deste recurso é apenas push — precaching e PWA completa trariam complexidade desnecessária. Um SW manual de ~40 linhas é mais simples, auditável e não exige nova dependência.

### D2 — Hook `usePushNotifications` isola toda a lógica browser

**Decisão**: criar `features/push-notifications/hooks/use-push-notifications.ts` que encapsula `navigator.serviceWorker`, `PushManager`, chamadas à API e estado (`permission`, `isSubscribed`).

**Razão**: componentes de layout não devem conhecer detalhes de API ou browser APIs. O hook é a única superfície testável unitariamente (mock de `navigator`).

### D3 — Registro acionado pelo layout autenticado, não por componente específico

**Decisão**: chamar `usePushNotifications` no componente raiz do layout autenticado (`app/(dashboard)/layout.tsx` ou equivalente).

**Alternativa**: um botão explícito de "ativar notificações".

**Razão**: a permissão do browser já apresenta um prompt nativo ao usuário — solicitar uma segunda confirmação seria redundante. O hook não pede permissão antes de checar se o browser suporta push, evitando prompts em browsers sem suporte.

### D4 — `subscription.id` persistido em `localStorage`

**Decisão**: após `POST /push-subscriptions` retornar `{ id }`, salvar em `localStorage` sob a chave `push_subscription_id`.

**Razão**: necessário para montar o endpoint `DELETE /push-subscriptions/:id` ao desativar. IndexedDB seria mais robusto, mas `localStorage` é suficiente para um UUID simples e evita complexidade extra.

### D5 — Estrutura de pastas segue o padrão da feature layer

**Decisão**: `features/push-notifications/api/types.ts`, `api/service.ts`, `api/queries.ts`, `hooks/use-push-notifications.ts`.

**Razão**: consistência com todas as outras features do projeto (`AGENTS.md` § API layer).

## Risks / Trade-offs

- **Safari < 16.4 não suporta Web Push** → Mitigação: feature-detect com `'PushManager' in window` antes de qualquer ação; degrada silenciosamente
- **Permissão negada pelo usuário** → Mitigação: hook verifica `Notification.permission === 'denied'` e não re-solicita; estado exposto para a UI opcionalmente mostrar instrução de como reativar
- **`localStorage` apagado pelo usuário** → Mitigação: na ausência do ID, tentar `swReg.pushManager.getSubscription()` e comparar `endpoint`; se não encontrar, simplesmente registrar novamente (backend aceita re-registro via 409)
- **SW em cache stale após deploy** → Mitigação: adicionar `Cache-Control: no-store` ao header de `public/sw.js` via `next.config` headers ou via Vercel `vercel.json`
- **`pushsubscriptionchange` requer acesso ao token de auth dentro do SW** → Mitigação: salvar o token no `localStorage` (já feito pelo interceptor de API); o SW lê via `clients.matchAll` + `postMessage` ou acessa diretamente; neste escopo, apenas re-envia via `fetch` com o token do `localStorage`

## Migration Plan

1. Adicionar `public/sw.js` — não afeta nada existente
2. Criar feature folder `features/push-notifications/` — não afeta nada existente
3. Integrar `usePushNotifications` no layout autenticado — única mudança em arquivo existente
4. Deploy normal — sem migrations de banco ou mudanças de schema no frontend
5. Rollback: remover a chamada no layout e deletar `public/sw.js`; browsers descartam SW automaticamente após 24h sem renovação

## Open Questions

- Qual arquivo exato é o layout raiz autenticado? (provavelmente `app/(dashboard)/layout.tsx` — confirmar ao implementar)
- O ícone `icon-192.png` existe em `public/`? Se não, qual ícone usar na notificação?
