## Why

A API de processo seletivo foi expandida com dois novos recursos — etapas (`/stages`) e candidatos (`/candidates`) — que permitem gerenciar o funil de seleção após a triagem inicial de candidaturas. A página `/psel` atual não expõe nenhum desses recursos, tornando o painel incompleto para quem conduz o processo.

## What Changes

- Aba **"Etapas"** integrada dentro da aba "Processos": cada processo exibe suas etapas, com ações para criar e editar (apenas assessor/presidente)
- Nova aba **"Candidatos"** na `PselView`: lista candidatos aprovados nas candidaturas, com filtros por processo e etapa; assessor/presidente podem avançar ou eliminar candidatos
- Status `reproved` → exibido como "Reprovado" no badge (a API usa `reproved`, não `rejected`, para candidatos e para o PATCH de applications)
- Tipos e repository atualizados para cobrir stages e candidates

## Capabilities

### New Capabilities

- `psel-stages`: Gestão de etapas de um processo seletivo (criar, listar por processo)
- `psel-candidates`: Visualização e progressão de candidatos no funil de etapas

### Modified Capabilities

- `selection-process-management`: Aba "Processos" passa a exibir e gerenciar etapas inline; status `reproved` corrigido no badge de applications

## Impact

- `src/types/selection-process.ts` — novos tipos `Stage`, `Candidate`, `CreateStagePayload`, `UpdateCandidatePayload`
- `src/repositories/selection-process.repository.ts` — novos hooks para `GET/POST /selection-process/stages` e `GET/PATCH /selection-process/candidates`
- `src/features/selection-process/components/` — novos componentes `stages-section.tsx`, `stage-form-dialog.tsx`, `candidates-tab.tsx`, `candidate-card.tsx`
- `src/features/selection-process/components/psel-view.tsx` — adiciona aba "Candidatos"
- `src/features/selection-process/components/application-status-badge.tsx` — suporte a `reproved`
