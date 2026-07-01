## 1. Tipos e repositório

- [x] 1.1 Adicionar `min_availability_hours: number` à interface `AppSettings` em `src/types/api.ts`
- [x] 1.2 Criar `src/repositories/routine.repository.ts` com tipos `RoutineSlots` e `RoutineResponse`, funções `getRoutine` e `updateRoutine`, hooks `useGetRoutine` e `useUpdateRoutine`
- [x] 1.3 Exportar `RoutineRepository` via `src/repositories/index.ts`

## 2. SettingsCard expandido

- [x] 2.1 Adicionar estado de edição para `min_availability_hours` no `SettingsCard` (estado local separado do `min_week_hours`)
- [x] 2.2 Adicionar descrição curta abaixo do título de cada configuração no `SettingsCard`
- [x] 2.3 Renderizar item de `min_availability_hours` com exibição "Desabilitado" quando valor é 0, e botão Editar para superusuários
- [x] 2.4 Implementar edição inline de `min_availability_hours` com input numérico (min=0, max=98) e toast de confirmação

## 3. RoutineCard — lógica central

- [x] 3.1 Criar `src/features/routine/components/routine-card.tsx` com estado local `slots: Record<Day, boolean[]>` inicializado a partir dos dados da API (ou todos false quando null)
- [x] 3.2 Implementar função de inicialização de slots (`emptySlots()` → 7 dias × 14 false) e mapeamento API → estado local
- [x] 3.3 Implementar lógica de toggle por clique em célula individual
- [x] 3.4 Implementar lógica de click-and-drag: `dragMode`, `isDragging`, listener `onMouseUp` no document para encerrar drag fora do grid
- [x] 3.5 Calcular total de horas disponíveis (count de `true` = horas) e lógica da barra de progresso
- [x] 3.6 Implementar handler "Salvar horário": transformar estado local → payload `{ slots: { mon, tue, ... } }` e chamar `useUpdateRoutine`

## 4. RoutineCard — UI desktop (grid)

- [x] 4.1 Criar sub-componente `RoutineGrid` exibido em `md:block hidden` com header de colunas (08-09, ..., 21-22) e linhas por dia
- [x] 4.2 Estilizar células: verde (`bg-emerald-700/80 hover:bg-emerald-600`) para disponível, vermelho escuro (`bg-red-900/70 hover:bg-red-800`) para indisponível, bordas arredondadas e transição de cor
- [x] 4.3 Adicionar label de horas por linha (ex: "8h") ao lado do nome do dia
- [x] 4.4 Adicionar hint "Clique e arraste para selecionar" alinhado à direita no header, visível apenas em desktop

## 5. RoutineCard — UI mobile (accordion)

- [x] 5.1 Criar sub-componente `RoutineAccordion` exibido em `md:hidden block` usando `Collapsible` do shadcn
- [x] 5.2 Renderizar strip horizontal de 14 mini-células no header de cada dia (recolhido)
- [x] 5.3 Renderizar grade de células expandida ao abrir o Collapsible, com células togglables por toque
- [x] 5.4 Exibir badge de horas disponíveis no header de cada dia do accordion

## 6. RoutineCard — barra de progresso e legenda

- [x] 6.1 Adicionar barra de progresso (`<Progress>`) abaixo do header do card, visível quando `min_availability_hours > 0`
- [x] 6.2 Adicionar badge "Xh / Yh mínimo" com cor de alerta quando abaixo do mínimo e cor de sucesso quando atingido
- [x] 6.3 Adicionar legenda com os dois indicadores visuais (Disponível / Indisponível)

## 7. Integração na página Individual

- [x] 7.1 Adicionar `RoutineCard` na página `src/app/dashboard/individual/page.tsx` abaixo da `ActivitiesSection`, com `Suspense` para streaming
- [x] 7.2 Garantir layout responsivo: em mobile a seção de atividades e o `RoutineCard` empilham verticalmente; em desktop permanecem em grid 2 colunas somente as atividades (routine fica abaixo em largura total)
