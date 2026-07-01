## ADDED Requirements

### Requirement: Atribuir membros a casas (assessor/presidente)
A aba "Casas" SHALL ser visível apenas a usuários com rank ≥ 3 e permitir a visualização dos membros de cada casa e a reatribuição de qualquer membro a uma casa diferente.

#### Scenario: Aba Casas visível apenas para admin
- **WHEN** o usuário tem rank < 3
- **THEN** a aba "Casas" não é exibida no componente de tabs

#### Scenario: Visualizar membros por casa
- **WHEN** o admin acessa a aba "Casas"
- **THEN** o sistema exibe as 3 casas com a lista de membros de cada uma, consumindo `GET /houses` e `GET /houses/:id/members` para cada casa

#### Scenario: Reatribuir membro a outra casa
- **WHEN** o admin seleciona um membro e escolhe uma casa diferente no seletor
- **THEN** `PATCH /houses/members/:user_id` é chamado com o novo `house_id`; a lista de membros é atualizada refletindo a mudança

#### Scenario: Membro sem casa atribuída
- **WHEN** existem usuários ativos sem `house_id`
- **THEN** o sistema exibe uma seção "Sem Casa" listando esses membros com opção de atribuição

#### Scenario: Atribuição bem-sucedida
- **WHEN** a chamada `PATCH /houses/members/:user_id` retorna 200
- **THEN** o membro desaparece da casa anterior e aparece na nova casa na listagem, sem necessidade de recarregar a página

### Requirement: Navegação lateral para gamificação
O item "Gamificação" SHALL ser adicionado ao menu de navegação lateral, visível a todos os usuários autenticados, apontando para `/dashboard/gamification`.

#### Scenario: Item de navegação visível para todos
- **WHEN** qualquer usuário autenticado carrega o dashboard
- **THEN** o item "Gamificação" aparece no menu lateral sem restrição de `minRank`

#### Scenario: Navegação para a página
- **WHEN** o usuário clica em "Gamificação" no menu lateral
- **THEN** é redirecionado para `/dashboard/gamification` e a aba "Ranking" é exibida por padrão
