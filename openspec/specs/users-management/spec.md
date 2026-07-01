## Requirements

### Requirement: Listagem de usuários para superusuários
A página `/dashboard/users` SHALL exibir uma tabela com todos os usuários cadastrados, contendo nome, email, CPF (mascarado), cargo e setor. O acesso SHALL ser restrito a usuários com `rank >= 3`. Usuários com rank inferior SHALL ser redirecionados para `/dashboard/ponto`.

#### Scenario: Superusuário acessa a página de usuários
- **WHEN** um usuário com rank >= 3 navega para `/dashboard/users`
- **THEN** a tabela SHALL exibir todos os usuários cadastrados com nome, email, CPF, cargo e setor

#### Scenario: Usuário comum tenta acessar a página de usuários
- **WHEN** um usuário com rank < 3 tenta acessar `/dashboard/users`
- **THEN** o sistema SHALL redirecionar para `/dashboard/ponto`

#### Scenario: Busca na tabela de usuários
- **WHEN** o superusuário digita um termo na busca
- **THEN** a tabela SHALL filtrar usuários por nome, email, cargo ou setor que contenham o termo (case-insensitive)

### Requirement: Edição de informações de usuário via modal
O superusuário SHALL poder abrir um modal de edição clicando em qualquer linha da tabela. O modal SHALL permitir editar `name`, `role`, `sector` e `cpf` do usuário selecionado.

#### Scenario: Abertura do modal de edição
- **WHEN** o superusuário clica em uma linha da tabela
- **THEN** um modal SHALL abrir com os dados atuais do usuário preenchidos nos campos de formulário

#### Scenario: Salvamento bem-sucedido
- **WHEN** o superusuário altera campos e clica em "Salvar"
- **THEN** o sistema SHALL enviar PATCH /users/:id com os dados alterados, exibir toast de sucesso e atualizar a tabela

#### Scenario: Cancelamento da edição
- **WHEN** o superusuário clica em "Cancelar" ou fecha o modal
- **THEN** o modal SHALL fechar sem enviar nenhuma requisição e a tabela SHALL permanecer inalterada

#### Scenario: Erro ao salvar
- **WHEN** a requisição de PATCH falha
- **THEN** o sistema SHALL exibir um toast de erro com a mensagem retornada pela API e o modal SHALL permanecer aberto
