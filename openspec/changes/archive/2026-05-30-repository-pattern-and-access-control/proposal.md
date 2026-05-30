## Why

À medida que o app cresce, a lógica de busca de dados está se espalhando por múltiplas feature folders (a entidade `User`, por exemplo, já existe em `ponto-eletronico/api`, `users/api` e `auth/api`), e o controle de acesso está fragmentado entre `RoleGuard` no cliente, `minRank` na nav e sem cobertura no middleware ou na busca — tornando difícil raciocinar sobre quem pode acessar o quê e de onde buscar dados.

## What Changes

- **Novo:** `src/repositories/` — uma pasta com um arquivo por entidade de domínio (`users.repository.ts`, `time-entries.repository.ts`, `settings.repository.ts`). Cada repository encapsula busca de dados, cache (React Query) e token internamente. Pages e componentes só importam do repository.
- **Novo:** hook interno `useAccessToken()` — obtém o `access_token` do Supabase internamente nos repositories, removendo a necessidade de passar token explicitamente nas views.
- **Modificado:** `src/config/nav-config.ts` — torna-se a fonte única de verdade de acesso a páginas, lida por navbar, middleware e barra de busca.
- **Modificado:** Middleware de rotas — passa a ler `nav-config.ts` para fazer redirect baseado em role (hoje só redireciona por autenticação).
- **Modificado:** Barra de busca (kbar) — filtra resultados usando o mesmo `nav-config.ts`, não exibindo páginas inacessíveis ao usuário atual.
- **Removido:** imports diretos de `api/queries.ts` e `api/service.ts` nas pages/componentes — substituídos por chamadas ao repository.

## Capabilities

### New Capabilities
- `entity-repositories`: Camada de repositório por entidade de domínio — interface única de acesso a dados para páginas e componentes, abstraindo fonte (API REST vs Supabase), token e cache.

### Modified Capabilities
- `user-access`: Extensão do controle de acesso para cobrir middleware (redirect server-side por role) e barra de busca (filtragem de resultados por role), além da navbar já existente — usando o mesmo `nav-config.ts` como única fonte de verdade.

## Impact

- **Arquivos removidos/refatorados:** `features/*/api/queries.ts`, `features/*/api/service.ts` (lógica migrada para repositories)
- **Arquivos novos:** `src/repositories/*.repository.ts`, `src/repositories/_shared/use-access-token.ts`
- **Arquivos modificados:** `src/config/nav-config.ts`, `src/utils/supabase/middleware.ts`, `src/components/kbar/`
- **Sem mudança de API externa** — os endpoints permanecem os mesmos
- **Sem breaking change de UX** — comportamento visível idêntico, apenas a origem dos dados e a aplicação de RBAC ficam centralizadas
