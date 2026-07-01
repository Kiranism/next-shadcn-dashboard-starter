# entity-repositories Specification

## Purpose

Define how domain data access is centralized behind per-entity repositories in `src/repositories/`. Each repository is the single import surface for pages and components that need an entity's data, resolves the auth token internally, exposes pure async functions for server-side prefetch, and keeps cache keys private with invalidation handled through the repository itself.

## Requirements

### Requirement: Repository por entidade como única interface de acesso a dados
O sistema SHALL expor um repository por entidade de domínio (`UserRepository`, `TimeEntriesRepository`, `SettingsRepository`) em `src/repositories/`. Cada repository SHALL ser o único ponto de importação para páginas e componentes que precisam de dados daquela entidade — imports diretos de `features/*/api/` SHALL ser proibidos nas views.

#### Scenario: Página busca lista de usuários
- **WHEN** um componente client-side precisa da lista de usuários
- **THEN** ele SHALL importar e chamar `UserRepository.useAll()` sem receber token como prop

#### Scenario: Página busca usuário específico
- **WHEN** um componente precisa dos dados de um usuário por ID
- **THEN** ele SHALL chamar `UserRepository.useOne(id)` sem conhecer a rota de API

#### Scenario: Página modifica um usuário
- **WHEN** um componente executa uma mutação de update
- **THEN** ele SHALL chamar `UserRepository.useUpdateOne()` e o hook SHALL invalidar o cache automaticamente após sucesso

### Requirement: Token resolvido internamente pelos hooks do repository
Os hooks de cada repository (ex: `useAll`, `useOne`, `useUpdateOne`) SHALL obter o `access_token` internamente via `useAccessToken()`. Nenhum hook público de repository SHALL aceitar `token` como parâmetro.

#### Scenario: Hook chamado sem token explícito
- **WHEN** um componente chama `UserRepository.useAll()` sem passar token
- **THEN** o hook SHALL obter o token via `useSession().session?.access_token` e incluí-lo na requisição

#### Scenario: Sessão expirada durante uso do hook
- **WHEN** o `access_token` retornado por `useSession()` for string vazia ou undefined
- **THEN** a query SHALL ficar desabilitada (`enabled: false`) e nenhuma requisição HTTP SHALL ser enviada

### Requirement: Funções assíncronas puras para uso server-side
Além dos hooks, cada repository SHALL expor funções assíncronas puras (ex: `UserRepository.getAll(token)`) que recebem o token explicitamente e retornam uma Promise. Essas funções SHALL ser usadas exclusivamente em server components para prefetch via `queryClient.prefetchQuery`.

#### Scenario: Server component faz prefetch da lista de usuários
- **WHEN** um server component chama `queryClient.prefetchQuery({ queryKey: UserRepository.keys.all(), queryFn: () => UserRepository.getAll(token) })`
- **THEN** os dados SHALL ser hidratados no cliente via `HydrationBoundary` sem nova requisição

#### Scenario: Função pura chamada sem token válido
- **WHEN** `UserRepository.getAll('')` é chamado com token vazio
- **THEN** o `api-client` SHALL lançar `ApiError(401)` antes de fazer a requisição HTTP

### Requirement: Cache keys privados e invalidação via repository
Os `queryKey` de cada entidade SHALL ser privados ao arquivo do repository e não exportados. A invalidação de cache entre entidades SHALL ser feita via métodos do repository, não via acesso direto às keys.

#### Scenario: Mutation de update invalida lista automaticamente
- **WHEN** `UserRepository.useUpdateOne()` conclui com sucesso
- **THEN** o cache de `UserRepository.keys.all()` SHALL ser invalidado, disparando refetch da lista

#### Scenario: Outro módulo precisa invalidar cache de usuários
- **WHEN** um módulo externo (ex: após onboarding) precisa invalidar o cache de usuários
- **THEN** ele SHALL chamar um método público do repository (ex: `UserRepository.invalidateAll(queryClient)`) em vez de usar a key diretamente
