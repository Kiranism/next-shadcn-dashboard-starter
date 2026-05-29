# User Access

Documenta como os dados do usuário são expostos e acessados em toda a aplicação WattDash — tipos, providers, hooks e padrões de RBAC.

## Arquitetura de dados do usuário

Existem dois objetos de usuário distintos em circulação:

```
Supabase User (auth)          UserProfile (wattapi)
─────────────────────         ──────────────────────────────
id: string (UUID)             id: string (mesmo UUID)
email: string                 email: string
user_metadata: object         name: string
app_metadata: object          role: Role
...                           sector: string | null
                              cpf: string | null
                              rank: number (derivado do role)
```

O `UserProfile` é o objeto principal para toda lógica de negócios. O `Supabase User` é usado apenas para obter o `access_token` que autentica chamadas ao wattapi.

## Types

### Role
```typescript
type Role = 'consultor' | 'gerente' | 'diretor' | 'assessor' | 'presidente';
```

### ROLE_RANK
```typescript
const ROLE_RANK: Record<Role, number> = {
  consultor:  0,
  gerente:    1,
  diretor:    2,
  assessor:   3,
  presidente: 4,
};
```

### UserProfile
```typescript
interface UserProfile {
  id:      string;
  email:   string;
  name:    string;
  role:    Role;
  sector:  string | null;
  cpf:     string | null;
  rank:    number;  // derivado via getRank(role)
}
```

## Provider stack

```
SessionProvider
  └─ expõe: { user, session, loading }
  └─ hook:  useSession()
  └─ fonte: supabase.auth (getSession + onAuthStateChange)

UserProfileProvider  (requer SessionProvider e QueryProvider)
  └─ expõe: { profile, isLoading, rank, profileMissing }
  └─ hook:  useUserProfile()
  └─ fonte: GET /auth/me via React Query
  └─ token: session.access_token
```

`UserProfileProvider` usa React Query com `staleTime: 5 minutos`. O perfil é refetchado automaticamente se o token mudar (muda a queryKey).

## Arquivos-chave

| Arquivo | Responsabilidade |
|---|---|
| `src/types/user-profile.ts` | Tipos `UserProfile`, `Role`, `ROLE_RANK`, `getRank()` |
| `src/components/providers/session-provider.tsx` | `SessionProvider` + `useSession()` |
| `src/components/providers/user-profile-provider.tsx` | `UserProfileProvider` + `useUserProfile()` |
| `src/features/auth/api/queries.ts` | `userProfileQueryOptions` — chama `GET /auth/me` |
| `src/lib/api-client.ts` | `apiGet/Post/Patch/Delete` — injeta bearer token |
| `src/hooks/use-nav.ts` | `useFilteredNavGroups/Items` — RBAC na navegação |
| `src/components/layout/role-guard.tsx` | `RoleGuard` — proteção de página por rank |
| `src/config/nav-config.ts` | Definição de grupos/itens de nav com `minRank` |

## Requirements

### Requirement: Hook useSession
O hook `useSession()` SHALL retornar `{ user: User | null, session: Session | null, loading: boolean }` refletindo o estado atual da sessão Supabase.

#### Scenario: Sessão ativa
- **WHEN** o usuário está autenticado no Supabase
- **THEN** `session.access_token` SHALL estar disponível e `loading` SHALL ser `false`

#### Scenario: Sem sessão
- **WHEN** o usuário não está autenticado
- **THEN** `user` e `session` SHALL ser `null` e `loading` SHALL ser `false`

### Requirement: Hook useUserProfile
O hook `useUserProfile()` SHALL retornar `{ profile: UserProfile | null, isLoading: boolean, rank: number, profileMissing: boolean }`.

`rank` SHALL ser `0` quando `profile` é `null`. `profileMissing` SHALL ser `true` apenas quando há token de sessão mas o wattapi retornou erro (usuário sem perfil cadastrado).

#### Scenario: Perfil carregado com sucesso
- **WHEN** `GET /auth/me` retorna dados válidos
- **THEN** `profile` SHALL conter `UserProfile` com `rank` calculado e `profileMissing` SHALL ser `false`

#### Scenario: Sem sessão
- **WHEN** não há `access_token`
- **THEN** a query SHALL estar desabilitada (`enabled: false`), `profile` SHALL ser `null` e `profileMissing` SHALL ser `false`

#### Scenario: Sessão presente mas sem perfil no wattapi
- **WHEN** há `access_token` mas `GET /auth/me` retorna erro
- **THEN** `profileMissing` SHALL ser `true` e `rank` SHALL ser `0`

### Requirement: Cálculo de rank
A função `getRank(role)` SHALL mapear strings de role para inteiros numéricos conforme `ROLE_RANK`. Roles desconhecidos SHALL retornar `0` (rank mais restrito).

#### Scenario: Role válido
- **WHEN** `getRank('assessor')` é chamado
- **THEN** SHALL retornar `3`

#### Scenario: Role desconhecido
- **WHEN** `getRank('unknown')` é chamado
- **THEN** SHALL retornar `0`

### Requirement: RBAC de navegação via minRank
`NavItem` e `NavGroup` aceitam `minRank?: number`. O hook `useFilteredNavGroups` SHALL remover itens e grupos cujo `minRank` exceda o rank atual do usuário. Grupos cujos todos os itens forem filtrados SHALL ser removidos inteiramente.

#### Scenario: Item sem minRank
- **WHEN** um item não tem `minRank` definido
- **THEN** SHALL ser exibido para qualquer usuário autenticado (equivale a `minRank: 0`)

#### Scenario: Grupo filtrado completamente
- **WHEN** todos os itens de um grupo têm `minRank > rank`
- **THEN** o grupo SHALL ser removido do resultado

### Requirement: Proteção de página via RoleGuard
O componente `RoleGuard` recebe `minRank: number` e SHALL redirecionar para `/dashboard` se `rank < minRank` após o perfil terminar de carregar. Durante o carregamento SHALL exibir um spinner.

#### Scenario: Rank suficiente
- **WHEN** `rank >= minRank` e o perfil carregou
- **THEN** o conteúdo filho SHALL ser renderizado normalmente

#### Scenario: Rank insuficiente
- **WHEN** `rank < minRank` e `isLoading === false`
- **THEN** `router.replace('/dashboard')` SHALL ser chamado e o conteúdo SHALL não ser renderizado

### Requirement: Acesso ao token para chamadas ao wattapi
Todos os componentes e hooks que chamam o wattapi SHALL obter o token via `useSession().session?.access_token` e passá-lo explicitamente para as funções do `api-client`. Nunca SHALL armazenar o token fora do contexto do React.

#### Scenario: Token presente
- **WHEN** `session.access_token` é não-nulo
- **THEN** as funções do api-client SHALL incluir `Authorization: Bearer {token}` em todas as requisições

#### Scenario: Token ausente
- **WHEN** `session` é `null` ou `access_token` é `undefined`
- **THEN** o api-client SHALL lançar `ApiError(401, 'Sessão inválida — faça login novamente.')` sem realizar a requisição HTTP

### Requirement: Ivalidação do cache de perfil após onboarding
Após a criação de perfil via `POST /users`, o cache React Query da chave `['auth', 'me']` SHALL ser invalidado imediatamente, forçando um refetch que preenche o `UserProfileContext` com o novo perfil.

#### Scenario: Onboarding completo
- **WHEN** `POST /users` retorna sucesso
- **THEN** `queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })` SHALL ser chamado antes do redirect para `/dashboard/ponto`
