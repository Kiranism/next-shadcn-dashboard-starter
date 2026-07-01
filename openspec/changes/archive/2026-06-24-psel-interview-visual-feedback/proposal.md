## Why

No fluxo atual de entrevistas PSEL, faltam feedbacks visuais críticos: a aba Candidatos não indica quais candidatos já agendaram entrevista e quais não, os consultores não conseguem ver quem será sua dupla (co-entrevistador) em um slot agendado, e a visão Equipe (heatmap) não diferencia slots disponíveis de slots já reservados — tornando impossível para superusers entender a ocupação real dos slots sem investigar individualmente cada consultor.

## What Changes

- **Candidatos com entrevista marcada**: na aba `Candidatos`, adicionar badge/indicador visual nos cards que sinalize se o candidato já agendou entrevista (tem `booking_id`) ou ainda não agendou.
- **Dupla do consultor**: na view pessoal de entrevistas (`Minha disponibilidade`), em slots agendados (`booking_id !== null`), exibir o nome do co-entrevistador (outro consultor que está no mesmo slot/horário); o dado deve vir da API ou ser derivado dos slots do admin.
- **Heatmap Equipe — slots livres vs. reservados**: refatorar `TeamAvailabilityHeatmap` para distinguir visualmente células com slots livres de células com slots parcialmente ou totalmente reservados, incluindo legenda clara; ao clicar numa célula, exibir separadamente consultores com slot livre e com slot reservado, e o candidato associado quando disponível.

## Capabilities

### New Capabilities

- `interview-booking-status-indicator`: Indicador visual por candidato mostrando se tem ou não entrevista agendada — introduz lógica de cruzamento entre `Candidate` e `MyInterviewSlot[]` para derivar `has_booking` por candidato.
- `consultant-pair-display`: Exibição do co-entrevistador (dupla) em slots agendados na view pessoal — requer que `MyInterviewSlot` traga dado do segundo consultor ou que o front derive isso dos slots completos.
- `heatmap-slot-status-distinction`: Heatmap de equipe com distinção visual entre slots livres e reservados por célula (dia-hora), com legenda e detalhe expandido ao clicar.

### Modified Capabilities

- `psel-candidates`: Os cards de candidatos passam a exibir status de agendamento de entrevista (informação que antes não estava presente).

## Impact

- `src/features/selection-process/components/candidates-tab.tsx` — exibição de badge de entrevista agendada por candidato
- `src/features/selection-process/components/candidate-card.tsx` (se existir) — badge de status de entrevista
- `src/features/selection-process/components/interviews-tab.tsx` — exibição de dupla nos slots pessoais agendados
- `src/features/selection-process/components/team-availability-heatmap.tsx` — distinção livre vs. reservado no heatmap
- `src/types/selection-process.ts` — possivelmente extensão de `MyInterviewSlot` para incluir co-entrevistador
- Nenhuma nova rota de API é criada; a lógica de dupla será derivada dos dados já disponíveis via `GET /selection-process/interviews/slots` (que para admins retorna todos os slots)
