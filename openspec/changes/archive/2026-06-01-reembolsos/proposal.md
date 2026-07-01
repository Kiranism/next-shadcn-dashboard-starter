## Why

O sistema não oferece nenhum mecanismo para que colaboradores solicitem reembolso de despesas, nem para que gestores acompanhem e aprovem essas solicitações. Com a nova rota `/reimbursements` já disponível na WattAPI, é o momento de expor essa funcionalidade no dashboard.

## What Changes

- **Nova página "Reembolsos"** (`/dashboard/reembolsos`) acessível a todos os usuários autenticados, onde cada colaborador pode submeter solicitações de reembolso e acompanhar o status das próprias solicitações.
- **Nova página "Controle de Reembolsos"** (`/dashboard/reembolsos/controle`) exclusiva para superusuários (rank ≥ 3), com visão agregada, gráficos analíticos, filtros e ações de aprovação/rejeição para o Presidente Executivo (rank 4).
- **Upload de comprovantes** diretamente ao bucket privado Supabase `reimbursement-receipts` antes de chamar a API.
- **Duas entradas na navegação**: "Reembolsos" no grupo "Aplicação" (visível a todos) e "Controle de Reembolsos" no grupo "Administração" (rank ≥ 3).

## Capabilities

### New Capabilities

- `submit-reimbursement`: Submissão de solicitação de reembolso por qualquer usuário autenticado, incluindo upload de comprovantes para Supabase Storage e visualização da própria lista com status.
- `reimbursement-control`: Visão administrativa com lista completa de reembolsos, filtros (nome, setor, cargo, status), gráficos analíticos (top 10 usuários por valor aprovado; consumo por setor) e aprovação/rejeição pelo Presidente Executivo.

### Modified Capabilities

## Impact

- `src/repositories/reembolsos.repository.ts` — novo repository com hooks TanStack Query
- `src/features/reembolsos/` — nova feature com components/ e upload logic
- `src/app/dashboard/reembolsos/page.tsx` — página do usuário
- `src/app/dashboard/reembolsos/controle/page.tsx` — página administrativa
- `src/config/nav-config.ts` — 2 novas entradas de navegação
- `src/components/icons.tsx` — adição do ícone `receipt` (IconReceipt do Tabler)
- `src/types/api.ts` — novos tipos para Reimbursement
- Dependência de `GET /users` já cacheada pelo UserRepository (sem custo extra)
- Supabase Storage: bucket `reimbursement-receipts` deve existir e estar configurado como privado
