# User Access

## Purpose

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
