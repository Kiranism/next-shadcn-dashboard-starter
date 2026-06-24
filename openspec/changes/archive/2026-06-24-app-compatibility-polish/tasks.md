## 1. Utilitário isClient e Guards de SSR

- [x] 1.1 Criar `src/lib/is-client.ts` exportando `export const isClient = typeof window !== 'undefined'`
- [x] 1.2 Auditar `src/features/routine/components/routine-card.tsx` e adicionar guards para acessos a `window`/`document` fora de `useEffect`
- [x] 1.3 Auditar `src/features/auth/components/google-auth-button.tsx` e `src/features/auth/components/forgot-password-form.tsx` para acessos a `window.location` sem guard
- [x] 1.4 Auditar `src/features/auth/components/sign-up-form.tsx` para acessos a `window` e adicionar `isClient` guard

## 2. Hooks de Responsividade com Estado undefined

- [x] 2.1 Alterar `src/hooks/use-mobile.tsx`: mudar `useState(false)` para `useState<boolean | undefined>(undefined)` e acessar `window.matchMedia` apenas dentro de `useEffect`
- [x] 2.2 Alterar `src/hooks/use-media-query.ts`: mudar `useState(false)` para `useState<boolean | undefined>(undefined)` e mover `window.matchMedia` para dentro de `useEffect`
- [x] 2.3 Auditar todos os consumidores de `useIsMobile` e `useMediaQuery` e garantir que tratam o caso `undefined` (renderizar layout padrão desktop quando `undefined`)
- [x] 2.4 Verificar `src/components/ui/infobar.tsx` e `src/components/layout/app-sidebar.tsx` para garantir compatibilidade com estado `undefined`

## 3. Push Notifications com Detecção de Suporte

- [x] 3.1 Adicionar checagem tripla `'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window` no início de `registerPush` em `src/features/push-notifications/hooks/use-push-notifications.ts`
- [x] 3.2 Envolver o bloco de registro do ServiceWorker em try/catch com `console.warn` em desenvolvimento
- [x] 3.3 Atualizar `src/app/dashboard/_components/push-notifications-register.tsx` para não lançar erro quando push não é suportado
- [x] 3.4 Testar que o app carrega normalmente em contexto sem ServiceWorker (HTTP local ou browser sem suporte)

## 4. Datas Dinâmicas — Eliminar Mismatch de Hidratação

- [x] 4.1 Auditar `src/features/activities/components/activity-calendar-card.tsx` e mover qualquer `new Date()` para `useEffect` com estado inicial `null`
- [x] 4.2 Auditar `src/components/ui/infobar.tsx` para uso de `Date.now()` ou datas no render síncrono
- [x] 4.3 Auditar `src/features/notifications/components/notification-item.tsx` para datas relativas calculadas no render
- [x] 4.4 Auditar `src/app/dashboard/individual/individual-view.tsx` para uso de `Math.random()` ou `new Date()` no render

## 5. Fallbacks CSS para oklch

- [x] 5.1 Identificar todas as variáveis `oklch()` nos blocos `:root` em `src/styles/globals.css`
- [x] 5.2 Adicionar declaração `hsl()` equivalente imediatamente antes de cada variável `oklch()` como fallback para Safari < 15.4
- [x] 5.3 Repetir o processo para todos os blocos de tema customizados (ex: `.theme-*`) em `globals.css`
- [x] 5.4 Verificar visualmente em Safari 15 (via BrowserStack ou devicecomputar) que as cores aparecem corretamente

## 6. Compatibilidade das Páginas PSEL Públicas

- [x] 6.1 Verificar layout de `src/app/psel/inscricao/page.tsx` em viewport de 375px (iPhone SE)
- [x] 6.2 Garantir que todos os `<input>` no formulário de inscrição PSEL têm `font-size` >= 16px para evitar zoom no iOS Safari
- [x] 6.3 Verificar `src/app/psel/entrevistas/[token]/page.tsx` para erros de hidratação — auditar componentes filhos
- [x] 6.4 Garantir que a página de entrevistas não tente acessar APIs de push ou autenticação durante o render

## 7. Varredura Final e Testes

- [x] 7.1 Rodar `next build` e verificar que não há erros ou warnings de hidratação no output
- [ ] 7.2 Testar o fluxo de login e dashboard no Safari 16 (iOS) e verificar que não há tela em branco
- [ ] 7.3 Testar a página `/psel/inscricao` em um dispositivo Android com Chrome
- [ ] 7.4 Testar o app em Firefox com modo privado (sem push) e verificar que não há erros no console
- [ ] 7.5 Verificar que os hooks de responsividade não causam flash de layout na sidebar no carregamento inicial
