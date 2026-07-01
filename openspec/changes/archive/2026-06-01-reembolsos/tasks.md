## 1. Tipos e Repository

- [x] 1.1 Adicionar tipos `Reimbursement`, `ReimbursementStatus`, `ReimbursementAttachment`, `CreateReimbursementPayload`, `UpdateReimbursementStatusPayload` em `src/types/api.ts`
- [x] 1.2 Criar `src/repositories/reembolsos.repository.ts` com hooks: `useOwn()` (GET /reimbursements?target=me), `useAll()` (GET /reimbursements?target=all), `useUpdateStatus()` (PATCH /reimbursements/:id/status), `useCreate()` (POST /reimbursements) e query key factory `reembolsosKeys`
- [x] 1.3 Adicionar `IconReceipt` do `@tabler/icons-react` ao `src/components/icons.tsx` com chave `receipt`

## 2. Upload de Comprovantes

- [x] 2.1 Criar `src/features/reembolsos/lib/upload-attachments.ts` com função `uploadAttachments(files, userId, supabaseClient)` que faz upload ao bucket `reimbursement-receipts` com path `receipts/${userId}/${uuid}/${filename}` e retorna `{ path, name }[]`
- [x] 2.2 Criar `src/features/reembolsos/components/attachment-upload.tsx` — drop zone com suporte a toque, listagem de arquivos com status (aguardando/enviando/enviado/erro), remoção individual, limite de 5 arquivos e 10MB por arquivo

## 3. Página Reembolsos (Usuário)

- [x] 3.1 Criar `src/features/reembolsos/components/reembolso-status-badge.tsx` — badge com cores semânticas: amarelo (pending), verde (approved), vermelho (rejected)
- [x] 3.2 Criar `src/features/reembolsos/components/reembolso-card.tsx` — card responsivo com ícone de categoria, título, valor em BRL, setor, data e status badge; exibe links dos comprovantes (signed_url) quando existirem
- [x] 3.3 Criar `src/features/reembolsos/components/reembolso-form-dialog.tsx` — dialog centralizado com campos: título, descrição, valor (máscara BRL → centavos), categoria (select), chave PIX, e componente AttachmentUpload; submit desabilitado durante upload; chama uploadAttachments + useCreate() em sequência
- [x] 3.4 Criar `src/features/reembolsos/components/reembolso-summary.tsx` — resumo com 3 chips (Pendente N, Aprovado N, Recusado N) e total aprovado em R$; scroll horizontal em mobile
- [x] 3.5 Criar `src/features/reembolsos/components/reembolsos-view.tsx` — view principal com ReembolsoSummary, botão "+ Nova Solicitação", lista de ReembolsoCard com estado de loading (Skeleton) e estado vazio
- [x] 3.6 Criar `src/app/dashboard/reembolsos/page.tsx` com `PageContainer` (pageTitle="Reembolsos", pageDescription="Solicite e acompanhe seus pedidos de reembolso") renderizando `ReembolsosView`

## 4. Página Controle de Reembolsos (Superusuário)

- [x] 4.1 Criar `src/features/reembolsos/components/controle/top-users-chart.tsx` — BarChart Recharts com top 10 usuários por valor total aprovado; tooltip com nome e valor em BRL; estado vazio quando sem dados; responsivo via ResponsiveContainer
- [x] 4.2 Criar `src/features/reembolsos/components/controle/sector-chart.tsx` — BarChart horizontal Recharts com consumo total aprovado por setor; ordenado decrescente; tooltip com setor e valor em BRL; responsivo
- [x] 4.3 Criar `src/features/reembolsos/components/controle/status-update-dialog.tsx` — dialog de confirmação com título da solicitação, valor, e botão semântico (verde=aprovar, vermelho=recusar); chama useUpdateStatus() e invalida queries ao completar
- [x] 4.4 Criar `src/features/reembolsos/components/controle/reembolso-controle-card.tsx` — card com info do solicitante (nome, setor, cargo), título, valor, data, status badge e botões Aprovar/Recusar condicionais (rank ≥ 4 e status=pending)
- [x] 4.5 Criar `src/features/reembolsos/components/controle/controle-filters.tsx` — filtros: input busca por nome, Select setor, Select cargo, Select status; estado gerenciado localmente e passado via props para a lista
- [x] 4.6 Criar `src/features/reembolsos/components/controle/controle-view.tsx` — view principal que: busca useAll() + UserRepository.useAll(), agrega dados client-side via useMemo, renderiza TopUsersChart + SectorChart em grid (2 col desktop, 1 col mobile), ControleFilters e lista filtrada de ReembolsoControleCard
- [x] 4.7 Criar `src/app/dashboard/reembolsos/controle/page.tsx` com `PageContainer` (pageTitle="Controle de Reembolsos") renderizando `ControleView`; page deve redirecionar ou retornar null se rank < 3

## 5. Navegação

- [x] 5.1 Adicionar entrada "Reembolsos" em `src/config/nav-config.ts` no grupo "Aplicação" com `url: '/dashboard/reembolsos'`, `icon: 'receipt'`, `minRank: 0`
- [x] 5.2 Adicionar entrada "Controle de Reembolsos" no grupo "Administração" com `url: '/dashboard/reembolsos/controle'`, `icon: 'receipt'`, `minRank: 3`
