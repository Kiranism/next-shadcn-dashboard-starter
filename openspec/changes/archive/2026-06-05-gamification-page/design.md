## Context

O sistema de gamificação existe inteiramente na API (casas, ciclos, tarefas, submissões, leaderboard) mas não tem nenhuma representação no dashboard. Todos os outros módulos do projeto seguem o padrão: `src/features/<feature>/` com subdiretórios `components/` e camada API em `lib/` ou serviços separados. A autenticação e controle de rank são feitos via `useUserProfile()` do `user-profile-provider`. O dashboard usa shadcn Tabs para organizar conteúdo multi-seção (ver `/dashboard/reembolsos/controle`). Upload de arquivos usa `attachment-upload` com Supabase Storage.

## Goals / Non-Goals

**Goals:**
- Página `/dashboard/gamification` responsiva e acessível a todos os usuários
- Leaderboard visual das casas com pontuação do ciclo ativo (inspirado na imagem de referência)
- Submissão de comprovantes de tarefas por qualquer usuário com casa atribuída
- CRUD de tarefas e gestão de ciclos exclusivo para assessores/presidentes (rank ≥ 3)
- Atribuição de membros a casas exclusiva para assessores/presidentes
- Revisão de submissões pendentes exclusiva para assessores/presidentes
- Navegação lateral: item "Gamificação" visível a todos

**Non-Goals:**
- Criação ou edição de casas (as 3 casas são fixas na API: Lumina, Voltus, Nexus)
- Histórico completo de ciclos encerrados com analytics avançados
- Notificações em tempo real via WebSocket

## Decisions

### D1 — Estrutura de abas por audiência

A página usa `Tabs` do shadcn para separar contextos. As abas renderizadas dependem do rank do usuário:

| Aba | Quem vê |
|---|---|
| Ranking | Todos |
| Tarefas | Todos (usuário comum submete; admin gerencia) |
| Minhas Submissões | Todos |
| Pendentes | Assessor/Presidente (rank ≥ 3) |
| Ciclos | Assessor/Presidente (rank ≥ 3) |
| Casas | Assessor/Presidente (rank ≥ 3) |

Alternativa considerada: páginas separadas por rota (ex: `/gamification/admin`). Rejeitada pois a separação em abas é mais simples de manter e a imagem de referência do usuário mostra exatamente esse padrão de tabs.

### D2 — Camada API seguindo o padrão do projeto

```
src/features/gamification/
  api/
    types.ts         # Tipos TypeScript espelhando a API
    service.ts       # fetch calls com auth token
    queries.ts       # queryKeys + queryOptions TanStack Query
  components/
    gamification-view.tsx         # Orchestrator com Tabs
    ranking-tab.tsx               # Leaderboard das casas
    tasks-tab.tsx                 # Tarefas + submissão
    my-submissions-tab.tsx        # Minhas submissões
    pending-submissions-tab.tsx   # Revisão (admin)
    cycles-tab.tsx                # Ciclos (admin)
    houses-tab.tsx                # Atribuição de casas (admin)
    house-card.tsx                # Card visual de casa (ranking)
    task-card.tsx                 # Card de tarefa com botão submeter
    submission-card.tsx           # Card de submissão
    submission-form-dialog.tsx    # Dialog de upload de comprovante
    task-form-dialog.tsx          # Dialog CRUD de tarefa (admin)
    cycle-form-dialog.tsx         # Dialog criação/encerramento de ciclo
```

### D3 — Upload de comprovantes

Antes de chamar `POST /gamification/submissions`, o frontend faz upload direto ao bucket `gamification-proofs` do Supabase Storage, seguindo o mesmo padrão de `attachment-upload.tsx` em reembolsos. O `file_path` retornado é enviado no body da submissão.

### D4 — Leaderboard visual

O ranking das casas renderiza 3 cards lado a lado no desktop (grade 3 colunas), empilhados no mobile. O card da casa em 1º lugar tem destaque visual (borda colorida, badge de troféu dourado). Cada card exibe: nome, pontuação total, e pódio dos top 3 membros com pontuação individual — consumindo `GET /gamification/leaderboard` e `GET /gamification/leaderboard/podium?house_id=<id>` em paralelo.

### D5 — Prefetch no servidor

A página usa o padrão padrão do projeto: `prefetchQuery` no Server Component + `useSuspenseQuery` no Client Component + `HydrationBoundary`. Dados iniciais: leaderboard e lista de tarefas ativas são prefetchados; dados admin (submissões pendentes, ciclos) são carregados somente se o usuário tiver rank ≥ 3.

## Risks / Trade-offs

- **Usuário sem casa** → `POST /gamification/submissions` retorna 400. O botão "Submeter" deve ser desabilitado com tooltip explicativo quando `house_id` for null no perfil do usuário.
- **Sem ciclo ativo** → Leaderboard e submissão falham com 404. Tratar com empty state claro indicando que nenhum ciclo está ativo.
- **Pódio por casa** → 3 chamadas paralelas a `GET /gamification/leaderboard/podium?house_id=<id>` no carregamento do ranking. Usar `Promise.all` no service ou queries em paralelo com `useSuspenseQueries`.
- **Signed URLs de submissões** → Válidas por apenas 1 hora. Não cachear além de `staleTime: 0` para evitar links expirados.
