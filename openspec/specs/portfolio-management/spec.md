## ADDED Requirements

### Requirement: Listagem pública do portfólio
O sistema SHALL exibir todos os itens do portfólio para qualquer usuário autenticado em `/dashboard/comercial/portfolio`. Os itens SHALL ser exibidos como cards ou lista ordenada por nome.

#### Scenario: Listagem geral
- **WHEN** qualquer usuário autenticado acessa a página de portfolio
- **THEN** a lista de itens do portfólio é exibida (GET /portfolio)

#### Scenario: Portfólio vazio
- **WHEN** não há itens cadastrados
- **THEN** uma mensagem de estado vazio é exibida

### Requirement: Criar item de portfólio (rank ≥ 2)
O sistema SHALL exibir o botão "Novo Serviço" e permitir criar itens somente para usuários com rank ≥ 2 (diretor, assessor, presidente). O formulário SHALL exigir `name` (único) e aceitar `description` opcional.

#### Scenario: Usuário sem permissão
- **WHEN** um usuário com rank < 2 acessa a página
- **THEN** os botões de criar/editar/deletar não são exibidos (somente leitura)

#### Scenario: Criar com nome duplicado
- **WHEN** o usuário tenta criar um item com um nome já existente
- **THEN** a API retorna 409 e o formulário exibe mensagem de erro

#### Scenario: Criar com sucesso
- **WHEN** o usuário preenche o nome e clica em "Salvar"
- **THEN** POST /portfolio é chamado
- **THEN** a lista é atualizada e o Dialog fecha

### Requirement: Editar e deletar item de portfólio (rank ≥ 2)
O sistema SHALL permitir editar nome e descrição e deletar itens de portfólio para usuários com rank ≥ 2.

#### Scenario: Editar item
- **WHEN** o usuário clica em editar um item e salva as alterações
- **THEN** PATCH /portfolio/:id é chamado
- **THEN** a lista é atualizada

#### Scenario: Deletar item com confirmação
- **WHEN** o usuário clica em deletar e confirma no AlertDialog
- **THEN** DELETE /portfolio/:id é chamado
- **THEN** o item é removido da lista
