## 1. Tipos e Repository

- [x] 1.1 Adicionar interfaces `Stage`, `Candidate`, `CreateStagePayload`, `UpdateCandidatePayload` em `src/types/selection-process.ts`; atualizar `SelectionProcessApplicationStatus` para incluir `reproved`
- [x] 1.2 Adicionar hooks `useStages`, `useCreateStage`, `useCandidates`, `useUpdateCandidate` em `src/repositories/selection-process.repository.ts` com keys factory para stages e candidates

## 2. Correção de Badge

- [x] 2.1 Atualizar `src/features/selection-process/components/application-status-badge.tsx` para mapear `reproved` → "Reprovado" (vermelho) e remover o alias `waitlisted → pending`
- [x] 2.2 Atualizar `src/features/selection-process/components/applications-tab.tsx` para enviar `{ status: "reproved" }` (não `"rejected"`) ao reprovar e aceitar também status `reproved` na exibição do card

## 3. Etapas inline na aba Processos

- [x] 3.1 Criar `src/features/selection-process/components/stage-form-dialog.tsx` — dialog para criar etapa com campos `name` (texto) e `position` (número inteiro positivo), tratando conflito de position (409)
- [x] 3.2 Criar `src/features/selection-process/components/stages-section.tsx` — seção expansível dentro do ProcessCard: lista etapas ordenadas por position com rótulo "Etapa N — Nome", botão "Nova Etapa" visível só para rank ≥ 3
- [x] 3.3 Atualizar `src/features/selection-process/components/processes-tab.tsx` para renderizar `<StagesSection processId={p.id} canEdit={canEdit} />` abaixo do ProcessCard

## 4. Aba Candidatos

- [x] 4.1 Criar `src/features/selection-process/components/candidate-status-badge.tsx` — badge para status de candidate: `active` (azul), `approved` (verde), `eliminated` (vermelho)
- [x] 4.2 Criar `src/features/selection-process/components/candidates-tab.tsx` — filtros por processo e etapa (etapa habilitada só após processo selecionado), grid responsivo de CandidateCards, estado vazio
- [x] 4.3 Criar `src/features/selection-process/components/candidate-card.tsx` — card com nome, curso, período, etapa atual, badge de status; botões "Avançar" (verde, ✓) e "Eliminar" (vermelho, ✗) apenas para rank ≥ 3 em candidatos `active`; clique no card abre sheet de detalhes com e-mail, telefone, tamanho de camiseta
- [x] 4.4 Atualizar `src/features/selection-process/components/psel-view.tsx` para adicionar a aba "Candidatos" com `<CandidatesTab />`
