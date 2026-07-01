## Context

O app usa TanStack Query + um `api-client` HTTP customizado. Hoje, cada feature folder tem sua própria pasta `api/` com `queries.ts`, `service.ts` e `types.ts`. O token Supabase é passado explicitamente de server components até os hooks das páginas. O controle de acesso existe apenas no cliente (via `RoleGuard` e `useFilteredNavGroups`) — não há proteção server-side por role e a barra de busca exibe todas as páginas independentemente do rank do usuário.

## Goals / Non-Goals

**Goals:**
- Criar uma camada de repositório por entidade que encapsula fetch, cache e token
- Tornar `nav-config.ts` a única fonte de verdade para acesso a páginas (navbar + middleware + kbar)
- Remover o token como argumento explícito nas views e componentes
- Manter compatibilidade total com o padrão de prefetch server-side do TanStack Query

**Non-Goals:**
- Reescrever a API externa (endpoints permanecem os mesmos)
- Implementar autenticação offline ou cache persistido
- Adicionar novas páginas ou funcionalidades de negócio

## Decisions

### D1 — Repository como objeto com hooks e fetchers

**Decisão:** Cada repository é um objeto exportado com dois tipos de membros:
- Funções assíncronas puras (`getAll`, `getOne`, `updateOne`) — para uso em server components e prefetch
- Hooks React (`useAll`, `useOne`, `useUpdateOne`) — para uso em client components, token resolvido internamente

```typescript
// Uso em server component
await queryClient.prefetchQuery({
  queryKey: UserRepository.keys.all(),
  queryFn: () => UserRepository.getAll(token),
})

// Uso em client component
const { data } = UserRepository.useAll()
const { mutate } = UserRepository.useUpdateOne()
```

**Alternativa considerada:** Repository apenas como classe com métodos estáticos. Descartado — não se integra bem com hooks React (hooks não podem ser métodos estáticos chamados condicionalmente).

**Alternativa considerada:** Repository expõe apenas `queryOptions` objects (atual). Descartado — a página ainda precisa saber que existe um `queryOptions`, quebrando o objetivo de abstração completa.

---

### D2 — Token resolvido via `useAccessToken()` nos hooks do repository

**Decisão:** Um hook compartilhado `useAccessToken()` em `repositories/_shared/` obtém o `access_token` da Supabase session via `useSession()` (provider já existente). Os hooks do repository chamam `useAccessToken()` internamente — a view nunca manipula o token.

```typescript
// repositories/_shared/use-access-token.ts
export function useAccessToken(): string {
  const { session } = useSession()
  return session?.access_token ?? ''
}
```

**Alternativa considerada:** Passar token como parâmetro para os hooks (`UserRepository.useAll(token)`). Descartado — polui a view com detalhe de infraestrutura, contrariando o objetivo central da mudança.

**Alternativa considerada:** Repository factory inicializado com token (`useUserRepository()`). Descartado — pattern incomum, adiciona indireção sem ganho real.

---

### D3 — Query keys permanecem privadas ao repository

**Decisão:** Os `queryKey` de cada entidade ficam dentro do arquivo do repository e não são exportados. A invalidação de cache em mutations usa os keys internos:

```typescript
// Dentro de users.repository.ts
const keys = {
  all: () => ['users'] as const,
  one: (id: string) => ['users', id] as const,
}
```

**Alternativa considerada:** Exportar `keys` para uso em invalidações externas. Descartado — se outra feature precisa invalidar `users`, deve fazê-lo via um método do próprio `UserRepository` (ex: `UserRepository.invalidateAll(queryClient)`).

---

### D4 — `nav-config.ts` como fonte única para acesso a páginas

**Decisão:** A configuração de navegação existente (`src/config/nav-config.ts`) é estendida para ser a fonte de verdade lida por três consumidores:

```
nav-config.ts
  ├── Navbar (client)      → useFilteredNavGroups() filtra por rank
  ├── Middleware (server)  → lê minRank da rota e redireciona se rank < minRank
  └── KBar (client)        → useFilteredNavGroups() ou lógica equivalente filtra resultados
```

O middleware precisa de uma forma de obter o `rank` do usuário server-side. O rank é derivado do `UserProfile.role`, que vem da API externa (`GET /auth/me`). **Não é viável** chamar a API no middleware por latência e complexidade.

**Solução:** Armazenar o `role` do usuário em um JWT claim customizado do Supabase ou em um cookie seguro httpOnly setado após o onboarding/login. O middleware lê o cookie para determinar o rank sem chamada adicional.

**Alternativa considerada:** Middleware chama `GET /auth/me` a cada request. Descartado — adiciona latência em toda navegação e cria dependência de disponibilidade da API externa no caminho crítico.

**Alternativa considerada:** Middleware só verifica autenticação, RoleGuard no cliente cuida do redirect por role. Descartado — o usuário pediu proteção server-side via middleware para evitar flash de conteúdo e acesso direto via URL.

---

### D5 — Estrutura de pastas dos repositories

```
src/
  repositories/
    _shared/
      use-access-token.ts
    users.repository.ts
    time-entries.repository.ts
    settings.repository.ts
```

Features continuam existindo para abrigar componentes e tipos específicos de UI. A pasta `features/*/api/` é removida gradualmente — types de domínio migram para `repositories/` ou `types/`.

## Risks / Trade-offs

**[Risk] Middleware lendo cookie de role pode ficar dessincronizado com o banco**
→ Mitigação: Refreshar o cookie após qualquer update de role (`UserRepository.useUpdateOne` invalida e força re-set do cookie). Implementar TTL curto no cookie (ex: 1h) com fallback para a API se cookie ausente.

**[Risk] Server components ainda precisam do token explícito para prefetch**
→ Mitigação: No server component, `await createClient().auth.getSession()` retorna o token — isso é aceitável pois o server component já é o ponto de acoplamento legítimo com infraestrutura.

**[Risk] Migração gradual cria dois padrões coexistindo**
→ Mitigação: Migrar por entidade completa de uma vez (não por feature). Definir uma task de "cleanup das feature api/" como etapa final explícita.

**[Risk] KBar atual pode ter lógica de resultados acoplada a strings hardcoded**
→ Mitigação: Auditar `src/components/kbar/` antes de implementar; se necessário, refatorar para ler `nav-config.ts` em vez de definir ações inline.

## Open Questions

- **Cookie de role:** Usar cookie customizado httpOnly ou JWT claim Supabase? JWT claim requer configuração no Supabase Dashboard; cookie é mais simples mas exige disciplina de refresh.
- **Tipos de domínio:** `UserResponse`, `ClockInResponse` etc. hoje estão em `features/*/api/types.ts`. Devem migrar para `repositories/` ou para `src/types/`?
