## ADDED Requirements

### Requirement: Listar tarefas ativas para todos os usuários
A aba "Tarefas" SHALL exibir a lista de tarefas ativas do sistema de gamificação, acessível a todos os usuários autenticados. Cada tarefa exibe título, descrição e pontuação.

#### Scenario: Visualização de tarefas ativas
- **WHEN** o usuário acessa a aba "Tarefas"
- **THEN** o sistema exibe todos os cards de tarefas com `is_active: true`, com título, descrição e pontos

#### Scenario: Nenhuma tarefa ativa
- **WHEN** não existem tarefas ativas cadastradas
- **THEN** o sistema exibe um empty state informando que nenhuma tarefa está disponível

### Requirement: Submeter comprovante de tarefa
Qualquer usuário com casa atribuída e ciclo ativo SHALL poder submeter um comprovante de conclusão de tarefa diretamente da aba "Tarefas". O comprovante (arquivo) é enviado ao Supabase Storage bucket `gamification-proofs` antes de confirmar a submissão.

#### Scenario: Submissão bem-sucedida
- **WHEN** o usuário seleciona uma tarefa, faz upload de um arquivo válido, preenche a descrição e confirma
- **THEN** o arquivo é enviado ao bucket `gamification-proofs` e `POST /gamification/submissions` é chamado com o `file_path` retornado; a submissão aparece na aba "Minhas Submissões" com status "pending"

#### Scenario: Usuário sem casa atribuída
- **WHEN** o usuário não possui `house_id` no perfil
- **THEN** o botão "Submeter" está desabilitado com tooltip explicando que é necessário estar em uma casa para submeter

#### Scenario: Sem ciclo ativo
- **WHEN** não existe ciclo ativo
- **THEN** o botão "Submeter" está desabilitado com tooltip informando que não há ciclo ativo no momento

### Requirement: Gerenciar tarefas (assessor/presidente)
Usuários com rank ≥ 3 (assessor ou presidente) SHALL ver controles adicionais na aba "Tarefas" para criar novas tarefas, editar tarefas existentes (título, descrição, pontos, ativo/inativo) e incluir tarefas inativas na listagem.

#### Scenario: Botão de criação visível apenas para admin
- **WHEN** o usuário tem rank ≥ 3 e acessa a aba "Tarefas"
- **THEN** um botão "Nova Tarefa" é exibido no topo da listagem

#### Scenario: Criar nova tarefa
- **WHEN** o admin preenche título, descrição e pontos no dialog e confirma
- **THEN** `POST /gamification/tasks` é chamado e a nova tarefa aparece na listagem

#### Scenario: Editar tarefa existente
- **WHEN** o admin clica em editar em uma tarefa e altera os campos
- **THEN** `PATCH /gamification/tasks/:id` é chamado e a tarefa é atualizada na listagem

#### Scenario: Desativar/ativar tarefa
- **WHEN** o admin altera o campo `is_active` na edição
- **THEN** `PATCH /gamification/tasks/:id` é chamado com o novo valor de `is_active`

#### Scenario: Listagem de tarefas inativas para admin
- **WHEN** o usuário tem rank ≥ 3
- **THEN** tarefas inativas são exibidas com badge visual "Inativa" na listagem
