## ADDED Requirements

### Requirement: Componentes de UI exclusivamente via shadcn/ui
Todos os elementos de interface interativos (selects, inputs, botões, modais, dropdowns, badges, etc.) SHALL utilizar os componentes de `@/components/ui/` (shadcn/ui). Elementos HTML nativos equivalentes (`<select>`, `<input>`, `<button>`, `<dialog>`, etc.) SHALL NOT ser usados diretamente em views e componentes de feature. A única exceção é `<table>` e seus filhos estruturais (`<thead>`, `<tbody>`, `<tr>`, `<td>`, `<th>`), que podem ser usados diretamente quando o componente `DataTable` do shadcn for inapropriado para o caso.

#### Scenario: Dropdown de filtro em tabela
- **WHEN** um componente precisa de um dropdown de seleção para filtrar dados
- **THEN** SHALL usar `<Select>` de `@/components/ui/select` em vez de `<select>` HTML nativo

#### Scenario: Campo de texto em formulário ou busca
- **WHEN** um componente precisa de campo de entrada de texto
- **THEN** SHALL usar `<Input>` de `@/components/ui/input` em vez de `<input>` HTML nativo

#### Scenario: Elemento interativo sem equivalente shadcn
- **WHEN** não existe componente shadcn adequado para o caso de uso
- **THEN** o componente SHALL ser construído sobre primitivos Radix UI ou adicionado ao registry shadcn antes de ser usado

### Requirement: `nav-config.ts` como fonte única de verdade para acesso a páginas
Cada item de página em `nav-config.ts` SHALL declarar o `minRank` necessário para acesso. Este campo SHALL ser lido por três consumidores: navbar (já existente), middleware e barra de busca. Nenhum consumidor SHALL duplicar a lógica de permissão — todos leem do mesmo objeto de configuração.

#### Scenario: Novo item de página adicionado ao nav-config
- **WHEN** um desenvolvedor adiciona um item com `minRank: 3` em `nav-config.ts`
- **THEN** a navbar SHALL ocultar o item para usuários com rank < 3, o middleware SHALL redirecionar esses usuários ao acessar a rota diretamente, e a kbar SHALL não exibir o item na busca

#### Scenario: Configuração de acesso alterada
- **WHEN** o `minRank` de uma página é alterado em `nav-config.ts`
- **THEN** os três consumidores SHALL refletir a mudança sem alteração de código adicional

### Requirement: Middleware protege rotas por rank via cookie de role
O middleware SHALL ler um cookie seguro `wattdash-role` para determinar o rank do usuário sem chamada à API externa. Se o cookie estiver presente e o rank derivado for inferior ao `minRank` da rota acessada, o middleware SHALL redirecionar para `/dashboard/ponto`. Se o cookie estiver ausente mas o usuário estiver autenticado (token Supabase válido), o middleware SHALL permitir acesso e delegar ao `RoleGuard` client-side.

#### Scenario: Usuário sem rank suficiente acessa URL diretamente
- **WHEN** um usuário com `wattdash-role: consultor` (rank 0) acessa `/dashboard/users` diretamente
- **THEN** o middleware SHALL interceptar e redirecionar para `/dashboard/ponto` antes de renderizar a página

#### Scenario: Usuário com rank suficiente acessa página restrita
- **WHEN** um usuário com `wattdash-role: assessor` (rank 3) acessa `/dashboard/users`
- **THEN** o middleware SHALL permitir o acesso e a página SHALL renderizar normalmente

#### Scenario: Cookie de role ausente (usuário autenticado)
- **WHEN** o usuário está autenticado mas o cookie `wattdash-role` não existe
- **THEN** o middleware SHALL permitir o acesso e delegar a verificação de role ao `RoleGuard` client-side

### Requirement: Cookie de role setado e atualizado após login e mudança de role
O cookie `wattdash-role` SHALL ser setado como httpOnly e Secure após login bem-sucedido (quando o `UserProfile` é carregado pela primeira vez) e SHALL ser atualizado imediatamente após qualquer alteração de role via `UserRepository.useUpdateOne()`.

#### Scenario: Cookie setado após primeiro carregamento do perfil
- **WHEN** `UserProfileProvider` carrega o `UserProfile` com sucesso pela primeira vez
- **THEN** uma server action ou route handler SHALL setar o cookie `wattdash-role` com o valor do `role` atual

#### Scenario: Role atualizado via admin
- **WHEN** `UserRepository.useUpdateOne()` conclui com sucesso alterando o `role`
- **THEN** o cookie `wattdash-role` SHALL ser atualizado para refletir o novo role antes do próximo request

### Requirement: Barra de busca (kbar) filtra resultados por rank do usuário
A kbar SHALL usar a mesma lógica de filtragem da navbar (`useFilteredNavGroups` ou equivalente) para excluir páginas inacessíveis dos resultados de busca. Itens com `minRank` superior ao rank atual do usuário SHALL não aparecer como resultado.

#### Scenario: Usuário busca uma página sem acesso
- **WHEN** um usuário com rank 0 digita o nome de uma página com `minRank: 3` na kbar
- **THEN** a página SHALL não aparecer nos resultados

#### Scenario: Usuário busca uma página com acesso
- **WHEN** um usuário com rank 3 digita o nome da mesma página com `minRank: 3`
- **THEN** a página SHALL aparecer nos resultados normalmente

## MODIFIED Requirements

### Requirement: RBAC de navegação via minRank
`NavItem` e `NavGroup` aceitam `minRank?: number`. O hook `useFilteredNavGroups` SHALL remover itens e grupos cujo `minRank` exceda o rank atual do usuário. Grupos cujos todos os itens forem filtrados SHALL ser removidos inteiramente. O mesmo hook ou função equivalente SHALL ser reutilizado pela kbar para consistência — não SHALL existir lógica de filtragem duplicada.

#### Scenario: Item sem minRank
- **WHEN** um item não tem `minRank` definido
- **THEN** SHALL ser exibido para qualquer usuário autenticado (equivale a `minRank: 0`)

#### Scenario: Grupo filtrado completamente
- **WHEN** todos os itens de um grupo têm `minRank > rank`
- **THEN** o grupo SHALL ser removido do resultado

#### Scenario: Kbar reutiliza a mesma lógica de filtragem da navbar
- **WHEN** `useFilteredNavGroups` é chamado
- **THEN** o resultado SHALL ser o mesmo tanto para a navbar quanto para os itens de busca da kbar — itens filtrados na navbar SHALL estar ausentes da kbar
