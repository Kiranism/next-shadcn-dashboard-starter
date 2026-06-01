## ADDED Requirements

### Requirement: Superusuário visualiza todos os reembolsos com filtros
O sistema SHALL permitir que usuários com rank ≥ 3 (assessor, presidente) acessem a página "Controle de Reembolsos" e vejam todas as solicitações de todos os colaboradores, obtidas via `GET /reimbursements?target=all`. O sistema SHALL cruzar os dados com `GET /users` para enriquecer cada registro com setor e cargo do solicitante. Filtros disponíveis: nome (busca textual), setor (select), cargo/role (select) e status (pending/approved/rejected).

#### Scenario: Listagem completa
- **WHEN** superusuário acessa a página Controle de Reembolsos
- **THEN** sistema exibe todas as solicitações de todos os usuários, ordenadas por data de criação (mais recente primeiro), com nome do solicitante, setor, cargo, título, valor, status badge e data

#### Scenario: Filtro por nome
- **WHEN** superusuário digita texto no campo de busca
- **THEN** lista é filtrada em tempo real para mostrar apenas solicitações cujo solicitante contém o texto buscado (case-insensitive)

#### Scenario: Filtro por setor
- **WHEN** superusuário seleciona um setor no filtro
- **THEN** lista exibe apenas solicitações de usuários do setor selecionado

#### Scenario: Filtro por cargo
- **WHEN** superusuário seleciona um cargo no filtro
- **THEN** lista exibe apenas solicitações de usuários com aquele cargo

#### Scenario: Filtro por status
- **WHEN** superusuário seleciona um status (Pendente / Aprovado / Recusado)
- **THEN** lista exibe apenas solicitações com aquele status

#### Scenario: Filtros combinados
- **WHEN** superusuário aplica múltiplos filtros simultaneamente
- **THEN** lista exibe apenas solicitações que satisfazem todos os critérios (AND lógico)

### Requirement: Gráfico de top 10 usuários por valor aprovado
O sistema SHALL exibir um BarChart (Recharts) com os 10 usuários que acumulam maior valor total de reembolsos aprovados. O eixo X representa os nomes dos usuários, o eixo Y representa o valor total em R$. Dados calculados client-side a partir da lista completa de reembolsos com status `approved`.

#### Scenario: Gráfico renderizado com dados
- **WHEN** há pelo menos um reembolso aprovado
- **THEN** gráfico exibe até 10 barras, cada uma representando um usuário, com tooltip mostrando nome e valor total formatado em BRL

#### Scenario: Sem reembolsos aprovados
- **WHEN** não há nenhum reembolso com status approved
- **THEN** sistema exibe estado vazio no lugar do gráfico

### Requirement: Gráfico de consumo total por setor
O sistema SHALL exibir um BarChart horizontal (Recharts) com o valor total de reembolsos aprovados agrupados por setor. Dados calculados client-side cruzando reembolsos com `status=approved` com a lista de usuários para obter o setor de cada solicitante.

#### Scenario: Gráfico renderizado
- **WHEN** há reembolsos aprovados de pelo menos um setor
- **THEN** gráfico exibe uma barra por setor com valor total em R$, ordenado do maior para o menor

#### Scenario: Responsividade dos gráficos
- **WHEN** viewport é menor que 768px (md breakpoint)
- **THEN** os dois gráficos são empilhados verticalmente e cada um ocupa largura total com scroll horizontal interno quando necessário

### Requirement: Presidente pode aprovar ou recusar solicitações pendentes
O sistema SHALL permitir que usuários com rank 4 (presidente) alterem o status de reembolsos com `status=pending` para `approved` ou `rejected` via `PATCH /reimbursements/:id/status`. A ação SHALL ser protegida por um dialog de confirmação que exibe o título e valor da solicitação. A operação é one-way: solicitações já aprovadas ou recusadas não podem ser alteradas.

#### Scenario: Presidente vê botões de ação em pendentes
- **WHEN** usuário autenticado tem rank 4 e visualiza a lista com solicitações pendentes
- **THEN** cada solicitação pendente exibe botões "Aprovar" e "Recusar"

#### Scenario: Superusuário não presidente não vê botões de ação
- **WHEN** usuário autenticado tem rank 3 (assessor)
- **THEN** botões de aprovar/recusar não são exibidos

#### Scenario: Dialog de confirmação antes de aprovar
- **WHEN** presidente clica em "Aprovar"
- **THEN** sistema exibe dialog com título da solicitação, valor e botão de confirmação "Confirmar Aprovação"

#### Scenario: Dialog de confirmação antes de recusar
- **WHEN** presidente clica em "Recusar"
- **THEN** sistema exibe dialog com título da solicitação, valor e botão destrutivo "Confirmar Recusa"

#### Scenario: Aprovação bem-sucedida
- **WHEN** presidente confirma a aprovação no dialog
- **THEN** sistema chama `PATCH /reimbursements/:id/status` com `{ status: "approved" }`, exibe toast de sucesso e a lista é atualizada

#### Scenario: Solicitação já resolvida não pode ser alterada
- **WHEN** status do reembolso é `approved` ou `rejected`
- **THEN** botões de ação não são exibidos para aquela solicitação
