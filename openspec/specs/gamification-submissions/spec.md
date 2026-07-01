## ADDED Requirements

### Requirement: Histórico de submissões do próprio usuário
A aba "Minhas Submissões" SHALL exibir todas as submissões do usuário autenticado, com status (pending, approved, rejected), nome da tarefa, data e link para o comprovante.

#### Scenario: Visualizar submissões próprias
- **WHEN** o usuário acessa a aba "Minhas Submissões"
- **THEN** o sistema exibe a lista de submissões do usuário ordenadas por data decrescente, com status visual (badge) para cada uma

#### Scenario: Submissão rejeitada com motivo
- **WHEN** uma submissão tem status "rejected" e possui `rejection_reason`
- **THEN** o motivo da rejeição é exibido no card da submissão

#### Scenario: Nenhuma submissão
- **WHEN** o usuário não possui submissões
- **THEN** o sistema exibe um empty state com instrução para submeter uma tarefa

### Requirement: Revisar submissões pendentes (assessor/presidente)
Usuários com rank ≥ 3 SHALL ver uma aba "Pendentes" com todas as submissões aguardando revisão, podendo aprovar ou rejeitar cada uma diretamente da listagem.

#### Scenario: Listar submissões pendentes
- **WHEN** o admin acessa a aba "Pendentes"
- **THEN** o sistema exibe todas as submissões com `status: "pending"`, com nome do membro, nome da tarefa, descrição e link para o comprovante

#### Scenario: Aprovar submissão
- **WHEN** o admin clica em "Aprovar" em uma submissão pendente e confirma
- **THEN** `PATCH /gamification/submissions/:id/review` é chamado com `status: "approved"` e a submissão é removida da lista de pendentes

#### Scenario: Rejeitar submissão com motivo
- **WHEN** o admin clica em "Rejeitar", preenche o motivo no dialog e confirma
- **THEN** `PATCH /gamification/submissions/:id/review` é chamado com `status: "rejected"` e `rejection_reason`; a submissão é removida da lista de pendentes

#### Scenario: Nenhuma submissão pendente
- **WHEN** não há submissões com status "pending"
- **THEN** o sistema exibe um empty state informando que não há submissões para revisar

### Requirement: Visualizar comprovante de submissão
O link de comprovante de uma submissão SHALL abrir o arquivo (signed URL) em nova aba para qualquer usuário que tenha acesso à submissão.

#### Scenario: Abrir comprovante
- **WHEN** o usuário clica no link/botão do comprovante de uma submissão
- **THEN** o arquivo abre em nova aba usando a `file_url` (signed URL válida por 1h) retornada pela API
