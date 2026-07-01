## 1. Types e API Layer — Normas

- [x] 1.1 Criar `src/types/norms.ts` com tipos `Norm`, `CreateNormPayload`, `UpdateNormPayload` (fields: `id`, `code`, `description`, `severity`, `created_at`, `updated_at`; severity enum: `leve | moderada | grave | desligamento`)
- [x] 1.2 Criar `src/repositories/norms.repository.ts` com query keys (`normsKeys`), funções `getNorms`, `createNorm`, `updateNorm`, `deleteNorm`, e hooks `useList`, `useCreate`, `useUpdate`, `useDelete` seguindo o padrão `portfolio.repository.ts`

## 2. Types e API Layer — Faltas

- [x] 2.1 Criar `src/types/violations.ts` com tipos `Violation`, `ViolationSummary`, `UserViolations`, `ViolationsMeResponse`, `CreateViolationPayload` (campos conforme API: `id`, `user_id`, `norm`, `reason`, `status`, `expires_at`, `cancelled_at`, `applied_at`, `created_at`; summary: `score`, `active_leves`, `active_moderadas`, `active_graves`, `active_desligamentos`, `at_risk`)
- [x] 2.2 Criar `src/repositories/violations.repository.ts` com query keys (`violationsKeys`), funções `getViolations`, `getViolationsMe`, `createViolation`, `cancelViolation`, e hooks `useList`, `useMe`, `useCreate`, `useCancel`

## 3. Navegação

- [x] 3.1 Adicionar item "Manual de Conduta" no grupo "Geral" de `src/config/nav-config.ts` com `url: '/dashboard/manual-de-conduta'`, `icon: 'post'`, `shortcut: ['m', 'c']`
- [x] 3.2 Adicionar item "Faltas" no grupo "Geral" de `src/config/nav-config.ts` com `url: '/dashboard/faltas'`, `icon: 'warning'`, `shortcut: ['f', 'f']`

## 4. Feature: Manual de Conduta — Componentes

- [x] 4.1 Criar `src/features/norms/components/norm-card.tsx` — card com `code`, `description`, badge de severidade (leve=verde, moderada=amarelo, grave=laranja, desligamento=vermelho) e botões editar/deletar condicionais por `canEdit`
- [x] 4.2 Criar `src/features/norms/components/norm-form-dialog.tsx` — Dialog com formulário usando `useAppForm`: campos `code` (readonly em edição), `description` (textarea), `severity` (Select com as 4 opções); chama `useCreate` ou `useUpdate` dependendo se `norm` prop está presente
- [x] 4.3 Criar `src/features/norms/components/delete-norm-dialog.tsx` — AlertDialog de confirmação que chama `useDelete`; exibe toast de erro específico quando a API retorna 409 (faltas associadas)
- [x] 4.4 Criar `src/features/norms/components/norms-view.tsx` — orquestra listagem (cards em `space-y-3`), estados de loading (skeletons), estado vazio, botão "Nova Norma" para superusuários, e abre `NormFormDialog`/`DeleteNormDialog`

## 5. Página: Manual de Conduta

- [x] 5.1 Criar `src/app/dashboard/manual-de-conduta/page.tsx` com `PageContainer` (`pageTitle: 'Manual de Conduta'`, `pageDescription: 'Normas e estatuto interno da empresa'`), `HydrationBoundary`, `Suspense` e `NormsView`

## 6. Feature: Faltas — Componentes

- [x] 6.1 Criar `src/features/violations/components/severity-badge.tsx` — componente de badge reutilizável para severidade (leve/moderada/grave/desligamento) com cores consistentes com as do norm-card
- [x] 6.2 Criar `src/features/violations/components/violations-table.tsx` — tabela com colunas: Nome, Cargo, Setor, Score (com badge "Em Risco" se `at_risk`), Leves, Moderadas, Graves, Desligamentos; cada linha é clicável e abre o sheet; inclui campo de busca por nome
- [x] 6.3 Criar `src/features/violations/components/member-violations-sheet.tsx` — Sheet lateral com: cabeçalho (nome do membro + badge "Em Risco" se `at_risk`), summary de score, lista de faltas (cada item mostra norma.code, norma.description, severity badge, reason, status, applied_at); botão cancelar (ícone trash) para callers com rank ≥ 1 em faltas com `status: 'active'`
- [x] 6.4 Criar `src/features/violations/components/apply-violation-dialog.tsx` — Dialog com formulário: Select de membro (subordinados da tabela), Select de norma (via `normsKeys`), Textarea de razão opcional; chama `useCreate` de violations; exibe toast de sucesso/erro adequado
- [x] 6.5 Criar `src/features/violations/components/violations-admin-view.tsx` — view para rank ≥ 1: compõe `ViolationsTable`, botão "Aplicar Falta", `ApplyViolationDialog`, `MemberViolationsSheet`
- [x] 6.6 Criar `src/features/violations/components/violations-me-view.tsx` — view para rank = 0 (consultor): usa `useMe` e exibe summary pessoal + lista de faltas do próprio usuário, sem tabela de membros e sem botão aplicar

## 7. Página: Faltas

- [x] 7.1 Criar `src/app/dashboard/faltas/page.tsx` com `PageContainer` (`pageTitle: 'Faltas'`, `pageDescription: 'Registro de infrações ao estatuto interno'`), lógica de branching por `rank`: rank = 0 renderiza `ViolationsMeView`, rank ≥ 1 renderiza `ViolationsAdminView`; `HydrationBoundary` e `Suspense`

## 8. Exportar repositórios

- [x] 8.1 Adicionar `NormsRepository` e `ViolationsRepository` ao barrel `src/repositories/index.ts`
