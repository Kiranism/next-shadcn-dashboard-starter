## Why

O sistema de gamificação da WattDash (casas, ciclos, tarefas e submissões) existe na API mas não tem interface no dashboard. Sem uma página dedicada, membros não conseguem acompanhar o ranking das casas nem submeter comprovantes, e assessores não podem gerenciar o sistema.

## What Changes

- Nova página `/gamification` acessível a todos os usuários autenticados
- Aba **Ranking** — leaderboard visual das 3 casas (Lumina, Voltus, Nexus) com pontuação do ciclo ativo e pódio de membros por casa
- Aba **Tarefas** — lista de tarefas ativas onde qualquer usuário pode submeter comprovantes; assessores/presidentes veem controles de criação, edição e ativação de tarefas
- Aba **Submissões** — histórico das próprias submissões para usuários comuns; assessores/presidentes veem todas as submissões pendentes para revisão
- Aba **Ciclos** — visível apenas a assessores/presidentes: criação e encerramento de ciclos
- Aba **Casas** — visível apenas a assessores/presidentes: atribuição de membros a casas
- Item de navegação lateral "Gamificação" adicionado para todos os usuários

## Capabilities

### New Capabilities

- `gamification-ranking`: Leaderboard público das casas com pontuação do ciclo ativo e pódio de membros por casa
- `gamification-tasks`: Listagem de tarefas para submissão de comprovantes + CRUD de tarefas para assessores/presidentes
- `gamification-submissions`: Histórico de submissões próprias e revisão de submissões pendentes para assessores/presidentes
- `gamification-cycles`: Criação e encerramento de ciclos (assessor/presidente)
- `gamification-houses`: Atribuição de membros a casas (assessor/presidente)

### Modified Capabilities

## Impact

- Novas rotas: `src/app/(dashboard)/gamification/page.tsx` e componentes filhos
- Nova camada de API: `src/features/gamification/api/` (types, service, queries)
- Navegação lateral: adicionar item em `src/config/nav.ts`
- Supabase Storage bucket `gamification-proofs` utilizado para upload de comprovantes
- Dependências: `@tanstack/react-query`, `nuqs`, shadcn components existentes, `react-dropzone` para upload
