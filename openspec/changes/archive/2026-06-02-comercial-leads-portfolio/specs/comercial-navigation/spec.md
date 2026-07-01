## ADDED Requirements

### Requirement: Grupo "Comercial" na sidebar
O sistema SHALL adicionar um grupo "Comercial" na sidebar contendo dois itens: "Leads" (`/dashboard/comercial/leads`) e "Portfólio" (`/dashboard/comercial/portfolio`).

#### Scenario: Grupo visível para superusuário
- **WHEN** um usuário com rank ≥ 3 (assessor ou presidente) acessa o dashboard
- **THEN** o grupo "Comercial" e seus dois itens são exibidos na sidebar

#### Scenario: Grupo visível para setor comercial
- **WHEN** um usuário com sector = "comercial" acessa o dashboard, independente do rank
- **THEN** o grupo "Comercial" e seus dois itens são exibidos na sidebar

#### Scenario: Grupo visível para diretor de marketing
- **WHEN** um usuário com role = "diretor" e sector = "marketing" acessa o dashboard
- **THEN** o grupo "Comercial" e seus dois itens são exibidos na sidebar

#### Scenario: Grupo oculto para outros
- **WHEN** um usuário com rank < 3 e sector diferente de "comercial" (exceto diretor de marketing) acessa o dashboard
- **THEN** o grupo "Comercial" não aparece na sidebar

### Requirement: Extensão de NavItem com allowedSectors
O tipo `NavItem` SHALL aceitar um campo opcional `allowedSectors?: string[]`. O hook `useFilteredNavGroups` SHALL exibir um item/grupo se `rank >= minRank` OR `userSector in allowedSectors`. Ambas as condições são OR, não AND.

#### Scenario: Item visível por sector sem rank suficiente
- **WHEN** um item tem `minRank: 3` e `allowedSectors: ['comercial']`
- **THEN** um usuário com rank 0 e sector "comercial" vê o item

#### Scenario: Item visível por rank sem sector permitido
- **WHEN** um item tem `minRank: 3` e `allowedSectors: ['comercial']`
- **THEN** um usuário com rank 3 e sector "projetos" vê o item

### Requirement: Portfólio visível a todos na nav
O item "Portfólio" no grupo Comercial SHALL ter acesso restrito somente pela visibilidade do grupo (rank ≥ 3 ou sector comercial ou diretor marketing). Dentro da página, o controle de leitura vs. escrita é feito pelo rank do usuário.

#### Scenario: Portfolio sem minRank próprio
- **WHEN** qualquer usuário que vê o grupo Comercial clica em "Portfólio"
- **THEN** acessa a página e visualiza os itens
