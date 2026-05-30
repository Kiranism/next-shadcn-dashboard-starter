## Requirements

### Requirement: Central de notificações acessível via sidebar
O `SidebarFooter` SHALL exibir um botão com ícone de sino acima do menu de avatar do usuário. O clique nesse botão SHALL abrir um `Sheet` lateral com a lista de notificações do usuário autenticado.

#### Scenario: Sidebar expandida — botão de sino visível
- **WHEN** o sidebar está expandido (modo padrão)
- **THEN** o botão SHALL exibir ícone de sino e o texto "Notificações" ao lado

#### Scenario: Sidebar colapsada — apenas ícone visível
- **WHEN** o sidebar está no modo colapsado (somente ícones)
- **THEN** o botão SHALL exibir apenas o ícone de sino com tooltip "Notificações"

#### Scenario: Usuário clica no botão de sino
- **WHEN** o usuário clica no botão de sino no sidebar
- **THEN** o `Sheet` de notificações SHALL abrir a partir da direita com a lista de notificações

### Requirement: Badge de contagem de notificações
Quando o usuário tiver ao menos uma notificação no inbox, SHALL ser exibido um badge numérico vermelho sobre o ícone de sino. Quando o sidebar estiver colapsado, o badge SHALL também ser exibido sobre o avatar do usuário no `SidebarUserFooter`.

#### Scenario: Usuário com notificações
- **WHEN** `GET /notifications` retorna array com 3 itens
- **THEN** o badge SHALL exibir "3" sobre o ícone de sino e sobre o avatar (quando sidebar colapsado)

#### Scenario: Usuário sem notificações
- **WHEN** `GET /notifications` retorna array vazio
- **THEN** nenhum badge SHALL ser exibido

#### Scenario: Badge com contagem alta
- **WHEN** `GET /notifications` retorna 10 ou mais itens
- **THEN** o badge SHALL exibir "9+" para evitar overflow visual

### Requirement: Listagem de notificações no Sheet
O `Sheet` SHALL exibir as notificações ordenadas por `sent_at DESC` (ordem já garantida pela API). Cada notificação SHALL mostrar `title`, `description` (se presente), `origin` (etiqueta visual diferenciando `automatic` de `directed`), e `sent_at` formatado como data legível em pt-BR. O Sheet SHALL ter scroll interno para listas longas.

#### Scenario: Inbox com notificações
- **WHEN** o Sheet abre e `GET /notifications` retorna notificações
- **THEN** cada item SHALL exibir título, descrição (se houver), badge de origem e data formatada

#### Scenario: Inbox vazio
- **WHEN** o Sheet abre e `GET /notifications` retorna array vazio
- **THEN** o Sheet SHALL exibir estado vazio com ícone e mensagem

#### Scenario: Estado de carregamento
- **WHEN** o Sheet abre enquanto `GET /notifications` ainda carrega
- **THEN** SHALL exibir skeleton loaders no lugar das notificações

### Requirement: Descarte de notificação individual
Cada item de notificação no Sheet SHALL ter um botão de fechar/deletar. Ao clicar, SHALL realizar `DELETE /notifications/:id` e remover o item da lista imediatamente (otimista) revertendo em caso de erro.

#### Scenario: Usuário descarta uma notificação
- **WHEN** o usuário clica no botão de descarte de uma notificação
- **THEN** o item SHALL desaparecer da lista imediatamente e `DELETE /notifications/:id` SHALL ser chamado em background

#### Scenario: Erro ao descartar
- **WHEN** `DELETE /notifications/:id` retorna erro
- **THEN** o item SHALL reaparecer na lista e um toast de erro SHALL ser exibido

#### Scenario: Badge atualizado após descarte
- **WHEN** o usuário descarta uma notificação com sucesso
- **THEN** o badge de contagem SHALL decrementar imediatamente

### Requirement: Polling automático de notificações
A query `GET /notifications` SHALL ser executada com `refetchInterval: 60_000` (1 minuto) enquanto o usuário estiver autenticado. O polling SHALL ser pausado quando a aba do navegador estiver em background.

#### Scenario: Atualização automática do badge
- **WHEN** uma nova notificação chega durante a sessão do usuário
- **THEN** após no máximo 1 minuto o badge SHALL atualizar para refletir a nova contagem

#### Scenario: Polling pausado em background
- **WHEN** o usuário troca de aba (aba em background)
- **THEN** o polling SHALL ser suspenso automaticamente pelo React Query (comportamento padrão)

### Requirement: Responsividade mobile do Sheet de notificações
O Sheet SHALL ser totalmente funcional em viewports a partir de 375px de largura. Em mobile, SHALL ocupar pelo menos 85% da largura da tela. Os botões de descarte SHALL ter área de toque mínima adequada para interação confortável.

#### Scenario: Sheet em mobile (375px)
- **WHEN** o Sheet é aberto em viewport de 375px
- **THEN** SHALL ocupar ≥ 85% da largura disponível sem overflow horizontal
