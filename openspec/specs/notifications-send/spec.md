## Requirements

### Requirement: Envio de notificações dirigidas via modal na página de usuários
Superusuários (rank ≥ 3) SHALL poder enviar notificações dirigidas a partir de um modal acessível pela página `/dashboard/users`, acionado por um botão de sino posicionado ao lado da barra de pesquisa da listagem de usuários.

#### Scenario: Superusuário acessa o modal de notificações
- **WHEN** um usuário com rank ≥ 3 clica no ícone de sino na página de usuários
- **THEN** o modal SHALL abrir com o formulário de envio de notificação

#### Scenario: Usuário comum não vê o botão de sino
- **WHEN** um usuário com rank < 3 acessa `/dashboard/users`
- **THEN** o usuário SHALL ser redirecionado antes de ver o componente

### Requirement: Formulário de envio de notificação dirigida
O formulário SHALL conter os campos `title` (obrigatório, mínimo 1 caractere), `description` (opcional), `target.sector` (select com opções de setor ou "Todos"), e `target.role` (select com opções de role ou "Todos"). O body enviado SHALL omitir campos não selecionados do objeto `target`.

#### Scenario: Envio com todos os destinatários
- **WHEN** o superusuário preenche `title` e deixa `target` vazio (ambos "Todos")
- **THEN** o sistema SHALL enviar `POST /notifications` com `{ title, target: {} }` e exibir toast de sucesso com o número de destinatários retornado (`count`)

#### Scenario: Envio filtrado por setor e role
- **WHEN** o superusuário seleciona `sector: "comercial"` e `role: "diretor"`
- **THEN** o sistema SHALL enviar `{ title, target: { sector: "comercial", role: "diretor" } }` e exibir toast de sucesso

#### Scenario: Envio com title vazio
- **WHEN** o superusuário tenta enviar sem preencher `title`
- **THEN** o formulário SHALL exibir erro de validação inline e não realizar a requisição

#### Scenario: Erro retornado pela API
- **WHEN** `POST /notifications` retorna erro
- **THEN** o sistema SHALL exibir toast de erro com a mensagem da API e o formulário SHALL permanecer aberto com os dados preenchidos

#### Scenario: Sucesso com zero destinatários
- **WHEN** `POST /notifications` retorna `{ count: 0 }`
- **THEN** o sistema SHALL exibir toast informando que nenhum usuário correspondeu ao filtro

#### Scenario: Campos resetados após envio bem-sucedido
- **WHEN** `POST /notifications` retorna sucesso
- **THEN** o modal SHALL fechar e todos os campos SHALL ser resetados para seus valores padrão

### Requirement: Integração com camada de API de notificações
A feature SHALL utilizar `NotificationsRepository.useSendNotification()` para enviar notificações. O service SHALL exportar `sendNotification(token, payload)` que chama `POST /notifications`. As queries SHALL expor `notificationKeys` como key factory.

#### Scenario: Chamada bem-sucedida ao service
- **WHEN** `sendNotification(token, { title: "Aviso", target: {} })` é chamado
- **THEN** SHALL realizar `POST /notifications` com `Authorization: Bearer {token}` e retornar `{ count: number }`

#### Scenario: Token ausente no service
- **WHEN** `sendNotification` é chamado sem token válido
- **THEN** o api-client SHALL lançar `ApiError(401)` antes de realizar a requisição HTTP
