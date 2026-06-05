## ADDED Requirements

### Requirement: Gerenciar ciclos de gamificação (assessor/presidente)
A aba "Ciclos" SHALL ser visível apenas a usuários com rank ≥ 3 e permitir a criação de novos ciclos e o encerramento do ciclo ativo.

#### Scenario: Aba Ciclos visível apenas para admin
- **WHEN** o usuário tem rank < 3
- **THEN** a aba "Ciclos" não é exibida no componente de tabs

#### Scenario: Visualizar ciclo ativo
- **WHEN** o admin acessa a aba "Ciclos" e existe um ciclo ativo
- **THEN** o sistema exibe o ciclo ativo com nome, data de início e um botão "Encerrar Ciclo"

#### Scenario: Criar novo ciclo
- **WHEN** não existe ciclo ativo e o admin clica em "Novo Ciclo" e preenche o nome
- **THEN** `POST /gamification/cycles` é chamado; o novo ciclo aparece como ativo na interface

#### Scenario: Encerrar ciclo ativo
- **WHEN** o admin clica em "Encerrar Ciclo" e confirma no dialog de confirmação
- **THEN** `PATCH /gamification/cycles/:id/close` é chamado; o ciclo é marcado como encerrado e o botão "Novo Ciclo" fica disponível

#### Scenario: Encerramento bloqueado por submissões pendentes
- **WHEN** o admin tenta encerrar o ciclo mas existem submissões com status "pending"
- **THEN** a API retorna 409 e o sistema exibe mensagem de erro informando que há submissões pendentes de revisão

#### Scenario: Tentativa de criar ciclo com ciclo já ativo
- **WHEN** o admin tenta criar um novo ciclo mas já existe um ciclo ativo
- **THEN** a API retorna 409 e o sistema exibe mensagem de erro informando que já existe um ciclo ativo

### Requirement: Listar histórico de ciclos
A aba "Ciclos" SHALL exibir todos os ciclos criados, ordenados por data de início decrescente, com status (ativo ou encerrado) e período de vigência.

#### Scenario: Histórico de ciclos
- **WHEN** o admin acessa a aba "Ciclos"
- **THEN** o sistema exibe a lista completa de ciclos consumindo `GET /gamification/cycles`, com nome, data de início, data de encerramento (ou "Em andamento" se ativo) e badge de status
