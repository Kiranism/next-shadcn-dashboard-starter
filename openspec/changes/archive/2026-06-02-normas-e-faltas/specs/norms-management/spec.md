## ADDED Requirements

### Requirement: Listagem de normas para todos os membros
O sistema SHALL exibir todas as normas internas para qualquer usuário autenticado em `/dashboard/manual-de-conduta`. As normas SHALL ser exibidas como cards ordenados por código (`code`). Cada card SHALL mostrar o código, a descrição e um badge colorido de severidade: `leve` = verde, `moderada` = amarelo, `grave` = laranja, `desligamento` = vermelho.

#### Scenario: Acesso à página
- **WHEN** qualquer usuário autenticado navega para `/dashboard/manual-de-conduta`
- **THEN** a lista de normas é carregada via `GET /norms` e exibida como cards

#### Scenario: Lista vazia
- **WHEN** não há normas cadastradas
- **THEN** um estado vazio é exibido com ícone e mensagem explicativa

#### Scenario: Loading state
- **WHEN** os dados ainda estão sendo carregados
- **THEN** skeletons de cards são exibidos no lugar do conteúdo

### Requirement: Criar norma (rank ≥ 3)
O sistema SHALL exibir o botão "Nova Norma" e permitir a criação de normas apenas para superusuários (rank ≥ 3). O formulário SHALL exigir `code` (identificador único, ex: `AN32`), `description` e `severity`.

#### Scenario: Usuário sem permissão não vê o botão
- **WHEN** um usuário com rank < 3 acessa a página
- **THEN** o botão "Nova Norma" e os controles de edição/deleção dos cards não são exibidos

#### Scenario: Criar norma com sucesso
- **WHEN** o superusuário preenche code, description, severity e clica em "Salvar"
- **THEN** `POST /norms` é chamado com os dados
- **THEN** o dialog fecha e a lista é atualizada com a nova norma

#### Scenario: Código duplicado
- **WHEN** o superusuário tenta criar uma norma com código já existente
- **THEN** a API retorna 409 e um toast de erro é exibido com mensagem clara

#### Scenario: Campos inválidos
- **WHEN** o superusuário tenta salvar com campos obrigatórios ausentes
- **THEN** o formulário exibe erros de validação inline sem fechar o dialog

### Requirement: Editar norma (rank ≥ 3)
O sistema SHALL permitir ao superusuário editar `description` e `severity` de uma norma. O campo `code` é exibido mas não editável (label somente leitura).

#### Scenario: Abrir dialog de edição
- **WHEN** o superusuário clica no botão de editar em um card de norma
- **THEN** o dialog abre com os campos `description` e `severity` preenchidos

#### Scenario: Salvar edição com sucesso
- **WHEN** o superusuário altera campos e clica em "Salvar"
- **THEN** `PUT /norms/:id` é chamado com os dados atualizados
- **THEN** o dialog fecha e o card é atualizado

#### Scenario: Erro ao editar
- **WHEN** a requisição `PUT /norms/:id` falha
- **THEN** um toast de erro é exibido e o dialog permanece aberto

### Requirement: Deletar norma (rank ≥ 3)
O sistema SHALL permitir ao superusuário remover permanentemente uma norma após confirmação em AlertDialog.

#### Scenario: Confirmar deleção com sucesso
- **WHEN** o superusuário clica em deletar e confirma no AlertDialog
- **THEN** `DELETE /norms/:id` é chamado e o card é removido da lista

#### Scenario: Norma com faltas associadas
- **WHEN** `DELETE /norms/:id` retorna 409
- **THEN** o AlertDialog fecha e um toast de erro informa que a norma possui faltas associadas e não pode ser removida
