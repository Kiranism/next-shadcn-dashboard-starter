## 1. Heatmap de Equipe — Distinção Livre vs. Reservado

- [x] 1.1 Em `team-availability-heatmap.tsx`, atualizar o `useMemo` do `grid` para computar `{ free: Set<string>, booked: Map<string, string> }` por célula (separar slots com `booking_id === null` de `booking_id !== null`), mantendo o mapa de nomes de consultores
- [x] 1.2 Adicionar lógica de estado visual por célula: vazio → muted, apenas livres → primary/azul, misto → âmbar (`bg-amber-500`), apenas reservados → esmeralda (`bg-emerald-600`)
- [x] 1.3 Atualizar o texto interno de cada célula do heatmap para exibir contagem separada quando há os dois tipos (ex: `"2 livre / 1 res."` ou simplesmente `"L:2 R:1"` em `text-[0.6rem]`)
- [x] 1.4 Adicionar legenda abaixo do grid com os três estados coloridos e rótulos: "Disponível", "Parcial", "Reservado"
- [x] 1.5 Atualizar a interface `SelectedCell` para incluir `bookedConsultants: Array<{ name: string; candidateName?: string }>` e `freeConsultants: string[]`
- [x] 1.6 Atualizar o handler `onClick` das células para popular os dois grupos ao abrir o dialog de detalhe
- [x] 1.7 Refatorar o dialog de detalhe para exibir dois grupos separados: "Com entrevista marcada" (com nome do candidato quando disponível) e "Disponíveis"
- [x] 1.8 Verificar responsividade mobile: garantir que o container com `overflow-x-auto` funcione em Safari iOS e Chrome Android sem quebrar o layout pai

## 2. View Pessoal — Exibir Co-entrevistador (Dupla)

- [x] 2.1 Em `interviews-tab.tsx`, adicionar `useMemo` `pairBySlotId: Map<string, string[]>` que, para cada slot pessoal com `booking_id !== null`, busca nos `slots` (todos) outros slots com mesmo `booking_id` e `consultant_id` diferente e coleta seus `consultant_name`
- [x] 2.2 Passar `pairNames?: string[]` como prop adicional para `SlotItem`
- [x] 2.3 Em `SlotItem`, quando `isBooked && pairNames && pairNames.length > 0`, exibir "Dupla: [nome(s)]" abaixo do nome do candidato, com ícone `Icons.user` e texto `text-xs text-muted-foreground`
- [x] 2.4 Garantir que a seção de dupla não seja renderizada quando `rank < 3` (prop `showPair?: boolean` controlada pelo `isAdmin` em `InterviewsTab`)

## 3. Aba Candidatos — Badge de Status de Entrevista

- [x] 3.1 Em `candidates-tab.tsx`, chamar `SelectionProcessRepository.useMyInterviewSlots()` somente quando `canEdit === true` (rank ≥ 3); construir `bookedEmails: Set<string>` com os `candidate_email` dos slots onde `booking_id !== null`
- [x] 3.2 Passar `hasInterview?: boolean` como prop para `CandidateCard`, derivado de `candidate.status === 'active' && bookedEmails.has(candidate.email)`
- [x] 3.3 Em `candidate-card.tsx`, quando `hasInterview === true` e candidato é `active`, exibir badge verde pequeno (ex: `<Badge variant='outline' className='border-emerald-300 text-emerald-700 text-xs'>Entrevista marcada</Badge>`) posicionado no canto superior do card ou abaixo do nome
- [x] 3.4 Quando `hasInterview === false` e candidato é `active` e prop `canShowInterviewStatus` está presente (admin), exibir badge neutro muted "Sem entrevista"
- [x] 3.5 Não exibir nenhum badge de entrevista quando `candidate.status !== 'active'`
- [x] 3.6 Validar que não há layout shift ou skeleton extra nos cards durante o carregamento dos slots

## 4. Validação e Cross-Browser

- [x] 4.1 Testar heatmap em Chrome desktop, Firefox desktop e Safari (modo responsivo simulando iOS)
- [x] 4.2 Confirmar que o scroll horizontal do heatmap funciona sem `overflow: hidden` no pai em Safari
- [x] 4.3 Confirmar que badges e texto pequeno (`text-[0.6rem]`) são legíveis em viewport 375px (iPhone SE)
- [x] 4.4 Confirmar que o dialog de detalhe do heatmap é scrollável em mobile com `max-h` e `overflow-y-auto`
