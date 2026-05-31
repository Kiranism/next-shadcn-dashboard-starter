## Context

A página `/dashboard/individual` já exibe `ActivitiesSection` (form + calendário de atividades). A API `/routine` (GET/PUT) existe e retorna `{ slots: null }` quando o usuário nunca configurou sua rotina, ou um objeto `{ slots: { mon: bool[14], ... } }` com os 14 slots de hora por dia. A página `/dashboard/ponto` tem um `SettingsCard` que expõe apenas `min_week_hours`; o campo `min_availability_hours` já existe na API mas não na UI.

## Goals / Non-Goals

**Goals:**
- Adicionar `RoutineCard` interativo na página Individual, consumindo `GET/PUT /routine`
- Layout desktop: grid 7 linhas (dias) × 14 colunas (slots), com suporte a click-and-drag
- Layout mobile: accordion por dia com strip visual de células coloridas
- Barra de progresso mostrando horas configuradas vs mínimo exigido (`min_availability_hours` das settings)
- Expandir `SettingsCard` para editar também `min_availability_hours`, com descrições em ambos os campos

**Non-Goals:**
- Visualizar a rotina de outros usuários (`GET /routine/:userId` e `GET /routine/summary`) — escopo futuro
- Animações complexas de drag além do comportamento básico de seleção/deselection de células

## Decisions

### 1. Estado local com commit explícito (botão "Salvar")

O grid não faz mutações a cada clique — mantém estado local `Record<Day, boolean[]>` inicializado com os dados da API. O botão "Salvar horário" dispara `PUT /routine`. Isso evita requests excessivos durante drag e dá ao usuário controle explícito antes de persistir.

**Alternativa descartada**: auto-save com debounce — mais complexo, difícil de dar feedback de erro, e o comportamento de "salvo automaticamente" pode surpreender o usuário.

### 2. Click-and-drag implementado com eventos React (onMouseDown/onMouseEnter/onMouseUp)

O componente rastreia: `dragMode` (`'select' | 'deselect'`), `isDragging` e aplica o modo a cada célula que o mouse entra durante o drag. O `onMouseUp` global no `document` encerra o drag mesmo se o mouse sair do grid.

**Alternativa descartada**: biblioteca de drag-and-drop — overhead desnecessário para uma interação simples de toggle.

### 3. Mobile como accordion (Collapsible do shadcn)

Cada dia vira um `Collapsible` com header mostrando nome do dia + badge de horas disponíveis + strip horizontal de mini-células coloridas. Ao expandir, mostra as 14 células em linha. Isso segue o design das imagens de referência.

**Alternativa descartada**: scroll horizontal do grid completo no mobile — funciona mas é UX pior para toque.

### 4. RoutineRepository isolado, paralelo ao padrão existente

`src/repositories/routine.repository.ts` com `useGetRoutine` (`useQuery`) e `useUpdateRoutine` (`useMutation`). Nomes de keys: `['routine', 'me']`. Exportado via `src/repositories/index.ts`.

### 5. SettingsCard refatorado, não reescrito

O componente atual gerencia apenas `min_week_hours` com estado local para edição inline. Será expandido para suportar os dois campos como entidades independentes editáveis — cada um com seu próprio estado de edição. A descrição de cada campo fica no `CardDescription` de cada item.

### 6. `AppSettings` recebe `min_availability_hours`

O tipo em `src/types/api.ts` recebe o campo opcional `min_availability_hours?: number` para não quebrar locais que já consomem o tipo (o valor pode ser 0 quando desabilitado).

## Risks / Trade-offs

- **Drag em touch (mobile)**: eventos `onMouseDown/Enter/Up` não funcionam para touch. No mobile o accordion é a UI principal, e as células são toggladas por tap simples — drag não é necessário. → Mitigation: eventos de drag ficam somente no container desktop, sem impacto no accordion mobile.
- **Dessincronização de `min_availability_hours` no progress bar**: o `RoutineCard` precisa do valor de settings para exibir a barra. → Mitigation: `RoutineCard` chama `SettingsRepository.useSettings()` internamente — dados já estão em cache após a `SettingsCard` montar.
- **`{ slots: null }` na primeira vez**: o componente inicializa os 7 dias com todos os 14 slots `false` quando slots é null. → Estado esperado e tratado explicitamente.
