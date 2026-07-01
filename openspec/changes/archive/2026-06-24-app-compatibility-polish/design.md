## Context

O WattDash é um Next.js 16 App Router com SSR habilitado. Vários usuários externos (candidatos PSEL, colaboradores em campo) acessam via Safari mobile, Chrome antigo, ou navegadores sem suporte a APIs modernas como Web Push. Os erros reportados são majoritariamente client-side e silenciosos: tela branca, componentes que não renderizam, ou funcionalidades que quebram sem mensagem de erro.

**Estado atual problemático:**
- `useIsMobile` e `useMediaQuery` iniciam com `false` no servidor, causando flash de layout incorreto quando o cliente descobre que é mobile
- `use-push-notifications` chama `navigator.serviceWorker` e `Notification.requestPermission()` sem verificar suporte, gerando exceções não capturadas no Safari < 16 e Firefox modo privado
- Variáveis CSS `oklch()` sem fallback `hsl()` causam ausência de cores em Safari < 15.4 (iOS 15 ainda em uso)
- Componentes com `new Date()` no render direto geram mismatch de hidratação (servidor renderiza com timezone do servidor, cliente com timezone local)

## Goals / Non-Goals

**Goals:**
- Eliminar erros de hidratação React em todos os browsers modernos (Chrome 100+, Safari 15+, Firefox 110+)
- Garantir que a ausência de suporte a Push Notifications e ServiceWorker não quebre outros fluxos
- Corrigir flash de layout em hooks de responsividade
- Adicionar fallbacks CSS para oklch em Safari legacy
- Guardar todos os acessos a `window`/`navigator`/`document` contra SSR

**Non-Goals:**
- Suporte a IE11 ou browsers pré-2020
- Polyfill completo de CSS Grid ou Flexbox
- Reescrever os provedores de autenticação (Supabase/Clerk)
- Otimizações de performance (bundle size, LCP)

## Decisions

### 1. Estado inicial `undefined` vs `false` em hooks de responsividade

**Decisão**: Mudar `useState(false)` para `useState<boolean | undefined>(undefined)` em `useIsMobile` e `useMediaQuery`.

**Rationale**: Com `false` inicial, o servidor renderiza como "desktop" e o cliente corrige para "mobile" causando um flash visual e possível erro de hidratação se a lógica de render divergir. Com `undefined`, o componente pode mostrar um estado neutro/skeleton até a resolução no cliente.

**Alternativa considerada**: `suppressHydrationWarning` nos elementos afetados. Rejeitado pois mascara o problema sem corrigi-lo.

### 2. Guard de browser APIs via `isClient` utilitário

**Decisão**: Criar `src/lib/is-client.ts` exportando `export const isClient = typeof window !== 'undefined'` e usar como guard em todos os acessos diretos ao browser fora de `useEffect`.

**Rationale**: Centralizar o guard evita inconsistências. O padrão `typeof window !== 'undefined'` está espalhado de forma ad-hoc no código; uma constante nomeada melhora a legibilidade.

### 3. Detecção de suporte a Push antes de registrar

**Decisão**: Verificar `'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window` antes de qualquer interação com a API. Falha silenciosa (sem erro para o usuário) quando não suportado.

**Rationale**: Safari < 16.4 e Firefox em modo privado não suportam push. Tentar registrar causa exceção não capturada que quebra o fluxo de autenticação. A feature de push é aditiva e não deve bloquear o uso do app.

**Alternativa considerada**: Try/catch global. Mantido como segunda camada de defesa, mas não como estratégia primária pois esconde bugs reais.

### 4. Fallbacks CSS para oklch

**Decisão**: Adicionar variáveis CSS duplicadas em `hsl()` antes de cada declaração `oklch()` nos blocos `:root` de `globals.css`.

**Rationale**: Browsers que não entendem `oklch()` ignoram a declaração e usam o fallback `hsl()`. É a abordagem mais simples e não quebra browsers modernos. Converter manualmente todas as variáveis existentes.

**Alternativa considerada**: PostCSS plugin `postcss-oklch`. Rejeitado pois adiciona dependência de build e pode gerar saída CSS imprecisa.

### 5. Datas no render: mover para `useEffect` ou `useMemo` com dependência de cliente

**Decisão**: Qualquer uso de `new Date()`, `Date.now()` em componentes que fazem SSR deve ser movido para dentro de `useEffect` com estado inicial `null`, renderizando um Skeleton ou `—` até hidratação.

**Rationale**: O servidor e cliente podem estar em timezones diferentes, o que gera mismatch de hidratação. Para datas relativas ("há 2 dias"), usar `date-fns` com valor estático passado como prop do servidor.

## Risks / Trade-offs

- **Flash de conteúdo undefined**: Hooks com estado `undefined` exigem que componentes tratem esse estado com skeleton/fallback. Se algum componente não tratar, pode mostrar `undefined` em tela. → Mitigação: auditar todos os consumidores de `useIsMobile` e `useMediaQuery` ao fazer a mudança.

- **oklch fallbacks imprecisos**: As cores `hsl()` não serão idênticas às `oklch()` em todos os casos — haverá pequena diferença visual em Safari legacy. → Aceitável pois esses usuários já veem algo errado (sem cor nenhuma).

- **Scope de varredura**: O projeto tem 176 componentes client-side. É possível que alguns casos de `window`/`document` fora de `useEffect` sejam perdidos na varredura. → Mitigação: adicionar checagem de `isClient` defensiva nos pontos mais críticos (auth, push, tema).

## Migration Plan

1. Deploy incremental — cada fix é isolado e não quebra outros componentes
2. Não há mudança de API pública ou schema de dados
3. Rollback: cada arquivo editado pode ser revertido individualmente via git
4. Testar em Safari 15 (iOS), Chrome 100, Firefox 110 após cada grupo de mudanças
