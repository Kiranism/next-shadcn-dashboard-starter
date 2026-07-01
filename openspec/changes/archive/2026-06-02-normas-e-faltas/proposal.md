## Why

O sistema carece de uma forma estruturada de comunicar as normas internas da empresa aos membros e de registrar/acompanhar infrações hierarquicamente. As rotas `/norms` e `/violations` da API já estão implementadas — agora é necessário expor essas funcionalidades no dashboard com a experiência adequada.

## What Changes

- Nova página `/dashboard/manual-de-conduta` visível para todos os membros autenticados, no grupo "Geral" da navegação
- Nova página `/dashboard/faltas` no grupo "Geral", com restrição de acesso por hierarquia (rank ≥ 1 para visualizar subordinados; consultor vê apenas suas próprias faltas)
- Manual de Conduta: listagem de normas com estética semelhante ao Portfólio; superusuários (rank ≥ 3) podem criar, editar e remover normas via modal/dialog
- Faltas: tabela de membros visíveis ao caller com score acumulado; sheet lateral com detalhamento das faltas do membro selecionado; aplicação de faltas via modal seguindo as regras hierárquicas da API
- Dois novos ícones na navbar sem colisão com os já existentes: `post` (Manual de Conduta) e `warning` (Faltas)

## Capabilities

### New Capabilities

- `norms-management`: CRUD de normas internas — listagem pública para todos os membros, criação/edição/remoção restrita a superusuários (rank ≥ 3). Página `/dashboard/manual-de-conduta`.
- `violations-management`: Visualização hierárquica de faltas dos subordinados com score acumulado, aplicação de faltas por gestores (rank ≥ 1), e sheet de detalhamento por membro. Página `/dashboard/faltas`.

### Modified Capabilities

## Impact

- `src/config/nav-config.ts` — adiciona dois itens no grupo "Geral"
- `src/components/icons.tsx` — nenhuma mudança necessária (`post` e `warning` já existem)
- `src/app/dashboard/manual-de-conduta/` — nova rota (page.tsx + componentes)
- `src/app/dashboard/faltas/` — nova rota (page.tsx + componentes)
- `src/features/norms/` — nova feature: api/types, api/service, api/queries, componentes
- `src/features/violations/` — nova feature: api/types, api/service, api/queries, componentes
- Dependência de dados: `GET /norms`, `POST /norms`, `PUT /norms/:id`, `DELETE /norms/:id`, `GET /violations`, `GET /violations/me`, `POST /violations`, `DELETE /violations/:id`
