## Why

Usuários que acessam via Safari, navegadores mais antigos, ou dispositivos iOS/Android estão encontrando erros client-side silenciosos (tela em branco, componentes que não carregam, hidratação quebrada) causados por acesso a APIs de browser sem guards de SSR, uso de `oklch()` sem fallback, e estados iniciais inconsistentes em hooks de responsividade. O problema é urgente pois afeta diretamente a confiabilidade da plataforma para o cliente final.

## What Changes

- **Guard de APIs de browser**: Todos os acessos a `window`, `navigator`, `document` e `localStorage` fora de `useEffect` recebem checagens `typeof window !== 'undefined'` para evitar crashes no SSR
- **Push Notifications com fallback**: Detecção de suporte a `Notification`, `ServiceWorker` e `PushManager` antes de tentar registrar, com degradação graciosa em browsers que não suportam
- **Hooks de responsividade corrigidos**: `useIsMobile` e `useMediaQuery` com estado inicial `undefined` em vez de `false` para evitar flash de layout errado no cliente
- **Fallback de cores OKLCH**: Variáveis CSS com fallback `hsl()` para browsers que não suportam `oklch()` (Safari < 15.4, Chrome < 111)
- **Varredura de hidratação**: Identificar e corrigir todo uso de `Math.random()`, `new Date()`, `Date.now()` em componentes renderizados no servidor
- **ServiceWorker defensivo**: O `sw.js` registrado para push notifications precisa de guard para ambientes sem suporte (iOS < 16.4, Firefox em modo privado)
- **Meta viewport e zoom**: Garantir que todas as páginas públicas (`/psel`, `/inscricao`) tenham viewport correto para mobile

## Capabilities

### New Capabilities
- `browser-compat-guards`: Utilitários e padrões para acesso seguro a APIs de browser (isClient, safeLocalStorage, etc.)

### Modified Capabilities
- `push-notifications`: Adicionar detecção de suporte antes de registrar ServiceWorker, evitar crash em Safari/Firefox sem suporte
- `psel-candidates`: Páginas públicas `/psel/*` precisam de viewport e comportamento mobile correto para candidatos externos

## Impact

- `src/hooks/use-mobile.tsx` — estado inicial `undefined`, guard de SSR
- `src/hooks/use-media-query.ts` — estado inicial `undefined`, guard de SSR
- `src/app/dashboard/_components/push-notifications-register.tsx` — verificação de suporte antes de registrar
- `src/features/push-notifications/hooks/use-push-notifications.ts` — guards para Notification/PushManager/ServiceWorker
- `src/components/themes/active-theme.tsx` — verificação de `typeof window` existente já está ok
- `src/features/activities/components/activity-calendar-card.tsx` — remover `new Date()` do render
- `src/components/ui/infobar.tsx` — garantir que `useIsMobile` use o novo padrão
- `styles/globals.css` — adicionar fallbacks hsl para variáveis oklch nos temas
- `src/app/psel/` e `src/app/inscricao/` — validar layout e viewport mobile
