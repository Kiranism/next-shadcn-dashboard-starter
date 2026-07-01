## 1. Camada de API (types, service, queries)

- [x] 1.1 Criar `src/features/gamification/api/types.ts` com os tipos `House`, `GamificationCycle`, `GamificationTask`, `GamificationSubmission`, `Leaderboard`, `PodiumEntry`
- [x] 1.2 Criar `src/features/gamification/api/service.ts` com funções fetch para todas as rotas: `getLeaderboard`, `getPodium`, `getCycles`, `getActiveCycle`, `getTasks`, `createTask`, `updateTask`, `getSubmissions`, `createSubmission`, `reviewSubmission`, `getHouses`, `getHouseMembers`, `assignHouseMember`
- [x] 1.3 Criar `src/features/gamification/api/queries.ts` com queryKeys factory `gamificationKeys` e `queryOptions` para cada endpoint

## 2. Navegação lateral

- [x] 2.1 Adicionar item "Gamificação" em `src/config/nav-config.ts` no grupo "Geral", com ícone `exclusive` (estrela), url `/dashboard/gamification`, sem restrição de `minRank`

## 3. Página e rota

- [ ] 3.1 Criar `src/app/dashboard/gamification/page.tsx` com `PageContainer` (título "Gamificação", descrição "Casas, ciclos e recompensas"), prefetch do leaderboard e tarefas no servidor com `HydrationBoundary`
- [x] 3.2 Criar `src/features/gamification/components/gamification-view.tsx` com `Tabs` do shadcn, renderizando as abas conforme o rank do usuário via `useUserProfile()`

## 4. Aba Ranking — Leaderboard

- [x] 4.1 Criar `src/features/gamification/components/house-card.tsx` com card visual da casa: posição destacada (troféu dourado/prateado/bronze), nome, pontuação total, pódio de top 3 membros com pontuação individual
- [x] 4.2 Criar `src/features/gamification/components/ranking-tab.tsx` que busca `GET /gamification/leaderboard` e `GET /gamification/leaderboard/podium?house_id=<id>` para cada casa em paralelo, renderiza grade responsiva 1→3 colunas, com empty state para ausência de ciclo ativo
- [x] 4.3 Aplicar destaque visual ao card em 1º lugar (borda colorida de destaque, ícone de troféu dourado); 2º e 3º com ícones diferenciados (prata, bronze)

## 5. Aba Tarefas

- [x] 5.1 Criar `src/features/gamification/components/task-card.tsx` com card de tarefa: título, descrição, pontos, badge "Inativa" condicional, botão "Submeter" (desabilitado com tooltip se sem casa ou sem ciclo ativo), botões de editar/desativar apenas para admin
- [x] 5.2 Criar `src/features/gamification/components/submission-form-dialog.tsx` com dialog de submissão: campo de descrição obrigatório, upload de arquivo ao bucket `gamification-proofs` via Supabase Storage client, confirmação que chama `POST /gamification/submissions`
- [x] 5.3 Criar `src/features/gamification/components/task-form-dialog.tsx` com dialog de CRUD de tarefa para admin: campos título, descrição, pontos, toggle is_active; chama `POST /gamification/tasks` ou `PATCH /gamification/tasks/:id`
- [x] 5.4 Criar `src/features/gamification/components/tasks-tab.tsx` que lista tarefas (ativas para usuário comum; ativas + inativas para admin) com botão "Nova Tarefa" visível apenas para rank ≥ 3

## 6. Aba Minhas Submissões

- [x] 6.1 Criar `src/features/gamification/components/submission-card.tsx` com card de submissão: nome da tarefa, data, status badge (pending/approved/rejected), motivo de rejeição condicional, botão para abrir comprovante em nova aba
- [x] 6.2 Criar `src/features/gamification/components/my-submissions-tab.tsx` que busca `GET /gamification/submissions` (target padrão = próprias) e renderiza lista com empty state

## 7. Aba Pendentes (admin)

- [x] 7.1 Criar `src/features/gamification/components/pending-submissions-tab.tsx` visível apenas para rank ≥ 3, com listagem de submissões `status: "pending"` filtradas via `?status=pending`; cada item tem botões "Aprovar" e "Rejeitar"
- [x] 7.2 Implementar dialog de rejeição com campo de motivo (`rejection_reason`) que chama `PATCH /gamification/submissions/:id/review` com `status: "rejected"`
- [x] 7.3 Implementar confirmação de aprovação direta que chama `PATCH /gamification/submissions/:id/review` com `status: "approved"`

## 8. Aba Ciclos (admin)

- [x] 8.1 Criar `src/features/gamification/components/cycle-form-dialog.tsx` com dialog de criação de ciclo (campo nome) que chama `POST /gamification/cycles`
- [x] 8.2 Criar `src/features/gamification/components/cycles-tab.tsx` visível apenas para rank ≥ 3, exibindo ciclo ativo em destaque com botão "Encerrar Ciclo" (com dialog de confirmação que chama `PATCH /gamification/cycles/:id/close`) e histórico de todos os ciclos abaixo
- [x] 8.3 Tratar erros 409 da API (ciclo já ativo, submissões pendentes) com toast de erro descritivo

## 9. Aba Casas (admin)

- [x] 9.1 Criar `src/features/gamification/components/houses-tab.tsx` visível apenas para rank ≥ 3, exibindo as 3 casas com seus membros atuais e uma seção "Sem Casa" para membros sem `house_id`
- [x] 9.2 Implementar seletor de casa por membro (select/dropdown shadcn) que chama `PATCH /houses/members/:user_id` ao selecionar uma casa diferente, com invalidação de query após sucesso
- [x] 9.3 Buscar lista de todos os usuários via `GET /users` para identificar membros sem casa e combinar com dados de `GET /houses/:id/members`
