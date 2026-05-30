## ADDED Requirements

### Requirement: Página de envio de notificações para superusuários
A página `/dashboard/notifications` SHALL ser acessível apenas a usuários com rank ≥ 3. Usuários com rank inferior SHALL ser redirecionados pelo middleware e pelo `RoleGuard`. A página SHALL exibir um formulário para criação de notificações dirigidas consumindo `POST /notifications`.

#### Scenario: Superusuário acessa a página de notificações
- **WHEN** um usuário com rank ≥ 3 navega para `/dashboard/notifications`
- **THEN** a página SHALL renderizar o formulário de envio de notificações

#### Scenario: Usuário comum tenta acessar a página de notificações
- **WHEN** um usuário com rank < 3 tenta acessar `/dashboard/notifications` diretamente
- **THEN** o middleware SHALL interceptar e redirecionar para `/dashboard/ponto`

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

### Requirement: Integração com camada de API de notificações
A feature SHALL expor `src/features/notifications/api/types.ts`, `src/features/notifications/api/service.ts` e `src/features/notifications/api/queries.ts` seguindo o padrão do projeto. O service SHALL exportar `sendNotification(token, payload)` que chama `POST /notifications`. As queries SHALL expor `notificationKeys` como key factory.

#### Scenario: Chamada bem-sucedida ao service
- **WHEN** `sendNotification(token, { title: "Aviso", target: {} })` é chamado
- **THEN** SHALL realizar `POST /notifications` com `Authorization: Bearer {token}` e retornar `{ count: number }`

#### Scenario: Token ausente no service
- **WHEN** `sendNotification` é chamado sem token válido
- **THEN** o api-client SHALL lançar `ApiError(401)` antes de realizar a requisição HTTP
