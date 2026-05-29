## ADDED Requirements

### Requirement: Registro de ponto — clock-in e clock-out
A página Ponto Eletrônico em `/dashboard/ponto` SHALL permitir que qualquer usuário autenticado registre entrada via `POST /time-entries/clock-in` e saída via `POST /time-entries/clock-out`.

O botão exibido SHALL refletir o estado atual: "Registrar Entrada" quando sem sessão aberta, "Registrar Saída" quando há sessão em andamento.

#### Scenario: Registrar entrada com sucesso
- **WHEN** o usuário clica em "Registrar Entrada"
- **THEN** é feita chamada `POST /time-entries/clock-in`, o botão muda para "Registrar Saída" e o resumo da semana é atualizado

#### Scenario: Registrar saída com sucesso
- **WHEN** o usuário clica em "Registrar Saída"
- **THEN** é feita chamada `POST /time-entries/clock-out`, o botão retorna para "Registrar Entrada" e o resumo é atualizado

#### Scenario: Erro no registro de ponto
- **WHEN** o wattapi retorna erro na operação de clock-in ou clock-out
- **THEN** exibe toast de erro com a mensagem retornada pela API, sem alterar o estado dos botões

### Requirement: Resumo semanal pessoal
A página SHALL exibir o resumo semanal do próprio usuário via `GET /time-entries/summary/me`, mostrando horas trabalhadas por dia da semana atual.

#### Scenario: Resumo carregado com sucesso
- **WHEN** a página carrega com usuário autenticado
- **THEN** exibe o resumo da semana atual com total de horas e detalhamento por dia

#### Scenario: Sem registros na semana
- **WHEN** o usuário não possui registros na semana atual
- **THEN** exibe estado vazio informativo, sem erros

### Requirement: Painel de superuser — listagem de usuários
Para usuários com rank >= 3 (assessor ou presidente), a página SHALL exibir uma seção adicional com a lista de usuários ativos via `GET /users`.

A listagem SHALL exibir: nome, role, setor e status (ativo). CPF SHALL ser exibido apenas para usuários com rank >= 2 (conforme regra do wattapi).

#### Scenario: Superuser vê painel de equipe
- **WHEN** o usuário tem rank >= 3 e acessa a página
- **THEN** a seção "Equipe" é renderizada com a listagem de usuários

#### Scenario: Usuário não-superuser não vê o painel
- **WHEN** o usuário tem rank < 3
- **THEN** a seção "Equipe" não é renderizada e nenhuma chamada a `/users` é feita

### Requirement: Resumo semanal por usuário (superuser)
Para usuários com rank >= 3, a página SHALL permitir selecionar um usuário da lista e visualizar o resumo semanal desse usuário via `GET /time-entries/summary/:userId`.

#### Scenario: Superuser consulta resumo de outro usuário
- **WHEN** o superuser clica em um usuário da lista
- **THEN** é exibido o resumo semanal desse usuário em um painel lateral ou modal

#### Scenario: API retorna 403 para usuário sem permissão
- **WHEN** um usuário não-superuser tenta acessar o resumo de outro usuário diretamente via URL
- **THEN** o wattapi retorna 403 e o frontend exibe mensagem de acesso negado sem quebrar a página
