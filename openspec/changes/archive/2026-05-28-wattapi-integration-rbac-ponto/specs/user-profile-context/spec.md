## ADDED Requirements

### Requirement: Provider de perfil do usuário
O sistema SHALL incluir um `UserProfileProvider` (Client Component) que, ao detectar uma sessão Supabase ativa, busca o perfil completo do usuário em `GET /auth/me` do wattapi e o armazena em contexto React.

O perfil SHALL incluir: `id`, `email`, `name`, `role` (string: consultor|gerente|diretor|assessor|presidente) e `rank` (number: 0–4 derivado do role).

#### Scenario: Usuário autenticado — perfil carregado
- **WHEN** o usuário possui sessão Supabase válida
- **THEN** o provider busca `/auth/me` e disponibiliza o perfil via contexto dentro de 1 ciclo de render após a sessão estar disponível

#### Scenario: Usuário não autenticado
- **WHEN** não há sessão Supabase ativa
- **THEN** o perfil no contexto é `null` e nenhuma chamada ao wattapi é feita

#### Scenario: Erro ao buscar perfil
- **WHEN** o wattapi retorna erro ou está indisponível
- **THEN** o perfil permanece `null` e o erro é capturado pelo React Query sem quebrar a árvore de componentes

### Requirement: Hook useUserProfile
O sistema SHALL exportar o hook `useUserProfile()` que retorna `{ profile: UserProfile | null, isLoading: boolean, rank: number }`, onde `rank` é `0` quando `profile` é `null`.

#### Scenario: Acesso ao rank em componente protegido
- **WHEN** um componente chama `useUserProfile()`
- **THEN** recebe o rank atual do usuário (0 se não carregado) sem precisar importar a lógica de hierarquia de roles diretamente

### Requirement: Mapeamento role → rank
O sistema SHALL manter um mapa constante `ROLE_RANK` idêntico ao do wattapi:
- `consultor` → 0, `gerente` → 1, `diretor` → 2, `assessor` → 3, `presidente` → 4

#### Scenario: Role desconhecido
- **WHEN** o wattapi retorna um role não presente no mapa
- **THEN** o rank calculado é `0` (rank mais restrito por padrão)
