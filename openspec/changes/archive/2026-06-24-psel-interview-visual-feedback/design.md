## Context

O módulo PSEL possui três pontos com falta de feedback visual:

1. **Aba Candidatos**: exibe cards de candidatos sem indicar se o candidato já agendou entrevista. Administradores precisam cruzar manualmente a lista de candidatos com os slots agendados.

2. **Minha disponibilidade (consultor)**: slots com `booking_id !== null` mostram o nome do candidato, mas não o co-entrevistador (dupla). A API retorna todos os slots para admins via `GET /selection-process/interviews/slots`; múltiplos consultores podem ter slots com o mesmo `booking_id` quando dois entrevistam o mesmo candidato.

3. **View Equipe (heatmap)**: `TeamAvailabilityHeatmap` usa uma única cor verde para qualquer célula com slots — sem distinguir `booking_id === null` (livre) de `booking_id !== null` (reservado). Superusers não conseguem ver a ocupação real da agenda.

Stack relevante: React Query (`useMyInterviewSlots` retorna `MyInterviewSlot[]`), Tailwind/OKLCH, shadcn/ui. Sem nova rota de API.

## Goals / Non-Goals

**Goals:**
- Badge por candidato indicando `com entrevista` / `sem entrevista` na aba Candidatos (somente admins — dados de slots são restritos a eles).
- Exibição do nome do co-entrevistador (dupla) em slots agendados na view pessoal (derivado dos dados do admin via mesmo hook).
- Heatmap com distinção visual livre vs. reservado: cores diferentes, contadores split (`livres/total`), legenda, e detalhe por grupo no dialog.
- Compatibilidade cross-browser (Chrome, Firefox, Safari 15+) e mobile-first.

**Non-Goals:**
- Criar endpoints de API novos.
- Mostrar dupla para consultores sem rank admin (não têm acesso aos slots dos outros).
- Alterar o fluxo de agendamento ou avaliação.
- Notificações push ou e-mails sobre status de agendamento.

## Decisions

### D1 — Derivar status de agendamento de candidato por e-mail

`MyInterviewSlot` expõe `candidate_email`. `Candidate` expõe `email`. Em `CandidatesTab`, carregar os slots (já disponível via `SelectionProcessRepository.useMyInterviewSlots()`) e construir um `Set<string>` de `candidate_email` dos slots com `booking_id !== null`. O match é feito por e-mail.

**Alternativa considerada**: Adicionar `candidate_id` ao tipo `MyInterviewSlot` e ao endpoint. Rejeitado por requerer mudança de backend.

**Alternativa considerada**: Chamar um endpoint de bookings separado. Rejeitado — não existe endpoint público de bookings para o dashboard.

**Risco**: Se um candidato tiver dois e-mails diferentes cadastrados (candidatura vs. booking), o match falha. Na prática, o e-mail vem da mesma candidatura; risco baixo.

### D2 — Derivar co-entrevistador pelo booking_id nos slots do admin

Para admins, `useMyInterviewSlots()` retorna TODOS os slots (todos os consultores). Para um slot pessoal com `booking_id`, filtra os outros slots com o mesmo `booking_id` e `consultant_id !== meu_id` → seus `consultant_name` são a dupla.

A lógica de derivação ocorre em `InterviewsTab` no `useMemo` que já filtra `mySlots`. Um segundo `useMemo` computa `pairBySlotId: Map<string, string[]>` usando todos os `slots` (não apenas `mySlots`).

**Alternativa considerada**: Exibir dupla somente se a API retornar o campo. Rejeitado — não há campo no tipo atual.

**Alternativa considerada**: Novo endpoint. Rejeitado — desnecessário quando os dados já existem no response de admin.

### D3 — Heatmap: dois contadores e três estados visuais por célula

Cada célula do heatmap computa `{ free: number, booked: number }`. Estados visuais:
- Vazio (0 slots): cinza muted (atual)
- Apenas livres: azul (`bg-primary/70`) — indica disponibilidade
- Misto (livres + reservados): âmbar (`bg-amber-500`) — indica ocupação parcial
- Apenas reservados: esmeralda (`bg-emerald-600`) — totalmente ocupado

Exibição interna à célula: `"L/R"` onde L=livres, R=reservados (ou só count se apenas um tipo).
O dialog de detalhe lista dois grupos: "Disponíveis" e "Com entrevista marcada", com o candidato associado quando `candidate_name` estiver presente.

**Alternativa considerada**: Barra de progresso dentro da célula. Rejeitado — as células são pequenas (h-9), difícil de renderizar legível em mobile com barra.

**Alternativa considerada**: Ícones de cadeado. Rejeitado — inacessível em telas pequenas.

### D4 — Não carregar slots extras em CandidatesTab

`CandidatesTab` já coexiste com `InterviewsTab` na mesma `PselView`. Os dados de `useMyInterviewSlots()` são cacheados por React Query com a key `selectionProcessKeys.interviewSlots()`. Chamá-lo em `CandidatesTab` (somente para admins) apenas reutiliza o cache — sem request extra.

## Risks / Trade-offs

- **Match por e-mail pode falhar para candidatos sem booking completo** → O badge simplesmente não aparece (`undefined` → sem badge), nunca mostra falso positivo.
- **Dois contadores na célula pequena do heatmap podem ficar ilegíveis em mobile** → Usar `text-[0.6rem]` e exibir contagem separada somente quando ambos > 0; caso contrário, exibir só o total como antes.
- **Admin vê dupla; consultor comum não** → Documentar no banner de instruções da aba. Não é bug — é limitação intencional de dados.
- **Regressão de performance em CandidatesTab** → O hook `useMyInterviewSlots` já tem cache; o `useMemo` de derivação é O(n) sobre slots. Com ~100 slots max, imperceptível.

## Migration Plan

Não há migração de dados. As mudanças são puramente de UI/front-end:
1. Editar `team-availability-heatmap.tsx` — heatmap
2. Editar `interviews-tab.tsx` — dupla do consultor
3. Editar `candidates-tab.tsx` + `candidate-card.tsx` — badge de entrevista agendada

Rollback: reverter os arquivos editados. Nenhum efeito colateral em dados ou API.

## Open Questions

- O backend retorna múltiplos slots com o mesmo `booking_id` quando dois consultores entrevistam o mesmo candidato? (Assumido: sim, baseado na intenção do modelo de dados. Se não, a dupla nunca será exibida — degradação silenciosa aceitável.)
- O campo `candidate_name`/`candidate_email` em `MyInterviewSlot` sempre é preenchido quando `booking_id !== null`? (Assumido: sim, baseado no código atual que já exibe `candidate_name` no `SlotItem`.)
