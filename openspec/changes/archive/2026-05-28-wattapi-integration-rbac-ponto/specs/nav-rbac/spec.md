## ADDED Requirements

### Requirement: Propriedade minRank em NavItem e NavGroup
O sistema SHALL estender os tipos `NavItem` e `NavGroup` com a propriedade opcional `minRank?: number`. Itens e grupos sem `minRank` (ou com `minRank: 0`) são visíveis para todos os usuários autenticados.

#### Scenario: Item sem minRank
- **WHEN** um NavItem não possui `minRank`
- **THEN** o item é exibido para qualquer usuário autenticado

#### Scenario: Item com minRank definido
- **WHEN** um NavItem possui `minRank: 3`
- **THEN** o item é exibido apenas para usuários com rank >= 3

### Requirement: Filtragem de navegação por rank
O hook `useFilteredNavGroups` SHALL filtrar grupos e itens com base no `rank` do usuário obtido via `useUserProfile()`, removendo do resultado qualquer item ou grupo cujo `minRank` seja maior que o rank do usuário.

#### Scenario: Superuser vê todos os itens
- **WHEN** o usuário tem rank >= 3
- **THEN** todos os itens de navegação são retornados sem filtragem

#### Scenario: Consultor não vê itens restritos
- **WHEN** o usuário tem rank 0 (consultor) e há itens com `minRank: 3`
- **THEN** esses itens são removidos do array retornado pelo hook

#### Scenario: Grupo completamente filtrado
- **WHEN** todos os itens de um NavGroup são filtrados por rank
- **THEN** o grupo inteiro é omitido do resultado

### Requirement: Proteção de rota por rank no layout do dashboard
O sistema SHALL incluir um Client Component `RoleGuard` que verifica o rank do usuário contra um `minRank` requerido. Se o rank for insuficiente (e o perfil já tiver carregado), SHALL redirecionar para `/dashboard`.

#### Scenario: Usuário com rank suficiente
- **WHEN** o usuário acessa uma rota protegida e possui rank >= minRank requerido
- **THEN** a página é renderizada normalmente

#### Scenario: Usuário sem rank suficiente (perfil carregado)
- **WHEN** o usuário acessa uma rota protegida com rank insuficiente e o perfil já carregou
- **THEN** é redirecionado imediatamente para `/dashboard`

#### Scenario: Perfil ainda carregando
- **WHEN** o usuário acessa uma rota protegida e o perfil ainda está sendo buscado
- **THEN** exibe skeleton/spinner até o carregamento completar, sem redirecionar prematuramente
