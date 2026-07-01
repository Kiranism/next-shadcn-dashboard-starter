## Why

O setor comercial da Watt Consultoria não possui uma área dedicada no WattDash para prospecção e acompanhamento de leads, nem para consulta do portfólio de serviços. Isso obriga os consultores a usarem ferramentas externas, fragmentando o fluxo de trabalho e dificultando o acompanhamento gerencial. A proposta foi elaborada internamente pelo setor comercial (Gabriel Novaes) e prioriza dados operacionais reais.

## What Changes

- Nova área **Comercial** na sidebar, visível para superusuários (rank ≥ 3), membros do setor `comercial` e diretores do setor `marketing`
- Nova página `/dashboard/comercial/leads` com gestão completa de leads (CRUD), gerenciamento de contatos e comentários, e integração com ViaCEP para preenchimento de endereço
- Cards de leads reformulados: exibem contato principal (nome + cargo), telefone, serviços de interesse e indicador "+X contatos adicionais"
- Filtros de status com contagem: `nao_contatado`, `em_progresso`, `finalizado` (fluxo proposto pelo relatório interno)
- Nova página `/dashboard/comercial/portfolio` com listagem pública do portfólio e CRUD restrito a rank ≥ 2 (diretor, assessor, presidente)
- Extensão do sistema de RBAC de navegação para suportar filtro por `sector` além de `minRank`

## Capabilities

### New Capabilities

- `leads-management`: CRUD de leads com contatos, comentários e endereço via ViaCEP; visualização em grid de cards com filtros por status; painel de detalhes em sheet lateral
- `portfolio-management`: Listagem e CRUD de itens do portfólio de serviços; acesso de leitura para todos, escrita restrita a rank ≥ 2
- `comercial-navigation`: Grupo "Comercial" na sidebar com RBAC por sector além de minRank; extensão dos tipos NavItem e do hook useFilteredNavGroups

### Modified Capabilities

_(nenhuma)_

## Impact

- `src/types/index.ts` — extensão de `NavItem` com `allowedSectors?: string[]`
- `src/hooks/use-nav.ts` — `useFilteredNavGroups` passa a checar `allowedSectors` usando o `sector` do perfil do usuário
- `src/config/nav-config.ts` — novo grupo `Comercial` com itens `leads` e `portfolio`
- `src/types/api.ts` — novos tipos `Lead`, `LeadContact`, `LeadComment`, `PortfolioItem`
- `src/components/icons.tsx` — novos ícones: `briefcase`, `building`, `mapPin`, `tag`
- Novas rotas: `src/app/dashboard/comercial/leads/page.tsx`, `src/app/dashboard/comercial/portfolio/page.tsx`
- Novas features: `src/features/leads/`, `src/features/portfolio/`
- API externa: ViaCEP (`viacep.com.br/ws/:cep/json/`) para preenchimento automático de endereço
