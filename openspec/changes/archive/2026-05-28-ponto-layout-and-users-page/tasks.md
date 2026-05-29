## 1. Correção de Datas no Ponto Eletrônico

- [x] 1.1 Criar função helper `formatDateBR(dateStr: string)` em `weekly-summary-card.tsx` que usa `new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })`
- [x] 1.2 Substituir exibição de `summary.week_start` e `summary.week_end` (linha 48) pelo resultado de `formatDateBR()` em `weekly-summary-card.tsx`
- [x] 1.3 Verificar e confirmar que `formatSessionRange` já usa `'pt-BR'` — nenhuma alteração necessária se já estiver correto

## 2. Melhoria de Layout no PontoEletronicoView

- [x] 2.1 Para usuário comum (`!isSuperuser`): alterar o wrapper do `WeeklySummaryCard` para `max-w-lg mx-auto w-full` em vez do grid com `max-w-md`
- [x] 2.2 Para superusuário: ajustar grid do topo para `grid-cols-1 lg:grid-cols-2` (ao invés de `sm:grid-cols-2`) para os cards `WeeklySummaryCard` + `SettingsCard`
- [x] 2.3 Garantir que a tabela `UsersSuperuserTable` ocupe largura total abaixo dos cards em todas as resoluções

## 3. Feature Module de Usuários

- [x] 3.1 Criar `src/features/users/api/types.ts` com interface `UpdateUserPayload { name?: string; role?: string; sector?: string | null; cpf?: string | null }`
- [x] 3.2 Criar `src/features/users/api/service.ts` com função `updateUser(token, userId, data)` chamando `apiPatch<UserResponse>('/users/:id', token, data)` (importar `UserResponse` de `@/features/ponto-eletronico/api/types`)
- [x] 3.3 Criar `src/features/users/api/queries.ts` com `usersListQueryOptions(token, isSuperuser)` reaproveitando a query existente (ou importando de `ponto-eletronico` diretamente)

## 4. Componentes da Página de Usuários

- [x] 4.1 Criar `src/features/users/components/edit-user-modal.tsx` com `<Dialog>` do shadcn/ui, formulário TanStack com campos `name`, `role`, `sector`, `cpf`, e botões "Salvar" / "Cancelar"
- [x] 4.2 A mutação do modal SHALL chamar `updateUser` do service, exibir toast de sucesso e invalidar a query `['users']` após salvar, ou exibir toast de erro e manter modal aberto em caso de falha
- [x] 4.3 Criar `src/features/users/components/users-view.tsx` com tabela de usuários (nome, email, CPF mascarado, cargo, setor), busca por texto, e clique em linha abrindo o `EditUserModal`

## 5. Página e Proteção de Rota

- [x] 5.1 Criar `src/app/dashboard/users/page.tsx` com `export const metadata` e renderização de `<UsersView>` dentro de `<PageContainer>`
- [x] 5.2 Adicionar verificação de rank no server component: buscar o perfil do usuário e redirecionar para `/dashboard/ponto` com `redirect()` se `rank < 3`

## 6. Verificação Final

- [x] 6.1 Confirmar que todas as datas em `/dashboard/ponto` exibem formato dd/mm/aaaa
- [x] 6.2 Confirmar layout do usuário comum: card centralizado com largura adequada em desktop e largura total em mobile
- [x] 6.3 Confirmar layout do superusuário: dois cards lado a lado em desktop (lg+) e tabela em largura total abaixo
- [x] 6.4 Confirmar que `/dashboard/users` é acessível apenas para superusuários e exibe a tabela corretamente
- [x] 6.5 Confirmar que o modal de edição abre, salva e fecha corretamente com feedback de sucesso/erro
