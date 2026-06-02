## 1. Fundação — Tipos, Ícones e RBAC de Navegação

- [x] 1.1 Adicionar tipos `Lead`, `LeadContact`, `LeadComment`, `LeadStatus`, `PortfolioItem`, `CreateLeadPayload`, `UpdateLeadPayload`, `CreatePortfolioPayload` em `src/types/api.ts`
- [x] 1.2 Registrar novos ícones em `src/components/icons.tsx`: `briefcase` (IconBriefcase), `building` (IconBuilding), `mapPin` (IconMapPin), `tag` (IconTag)
- [x] 1.3 Adicionar campo `allowedSectors?: string[]` ao tipo `NavItem` em `src/types/index.ts`
- [x] 1.4 Atualizar `useFilteredNavGroups` em `src/hooks/use-nav.ts` para checar `rank >= minRank OR userSector in allowedSectors`
- [x] 1.5 Adicionar grupo "Comercial" com itens "Leads" e "Portfólio" em `src/config/nav-config.ts` com `allowedSectors: ['comercial']` e `minRank: 3` (plus diretor de marketing via allowedSectors com lógica de role)

## 2. Camada de API — Portfolio

- [x] 2.1 Criar `src/features/portfolio/api/types.ts` com `PortfolioItem`, `CreatePortfolioPayload`, `UpdatePortfolioPayload`
- [x] 2.2 Criar `src/features/portfolio/api/service.ts` com `getPortfolio`, `createPortfolioItem`, `updatePortfolioItem`, `deletePortfolioItem` usando `apiGet/apiPost/apiPatch/apiDelete`
- [x] 2.3 Criar `src/features/portfolio/api/queries.ts` com `portfolioKeys` factory e `portfolioQueryOptions`

## 3. Camada de API — Leads

- [x] 3.1 Criar `src/features/leads/api/types.ts` com todos os tipos do domínio de leads
- [x] 3.2 Criar `src/features/leads/api/service.ts` com `getLeads`, `getLead`, `createLead`, `updateLead`, `deleteLead`, `createContact`, `updateContact`, `deleteContact`, `createComment`, `updateComment`, `deleteComment`
- [x] 3.3 Criar `src/features/leads/api/queries.ts` com `leadKeys` factory, `leadsQueryOptions` e `leadDetailQueryOptions`

## 4. Página e Componentes — Portfólio

- [x] 4.1 Criar rota `src/app/dashboard/comercial/portfolio/page.tsx` com `PageContainer` e `PortfolioView`
- [x] 4.2 Criar `src/features/portfolio/components/portfolio-view.tsx` com listagem de itens e botão "Novo Serviço" condicional ao rank ≥ 2
- [x] 4.3 Criar `src/features/portfolio/components/portfolio-item-card.tsx` com nome, descrição e ações de editar/deletar condicionais ao rank
- [x] 4.4 Criar `src/features/portfolio/components/portfolio-form-dialog.tsx` para criação e edição (Dialog + TanStack Form + Zod)
- [x] 4.5 Criar `src/features/portfolio/components/delete-portfolio-dialog.tsx` com AlertDialog de confirmação

## 5. Componentes de Leads — Cards e Filtros

- [x] 5.1 Criar `src/features/leads/components/lead-status-badge.tsx` com dot colorido e label para cada status
- [x] 5.2 Criar `src/features/leads/components/lead-card.tsx` conforme especificação: nome empresa, dot de status, contato principal (nome + cargo), telefone, serviços de interesse, indicador de contatos adicionais
- [x] 5.3 Criar `src/features/leads/components/leads-filters.tsx` com filtros de status com contagem e campo de busca por texto
- [x] 5.4 Criar `src/features/leads/components/leads-empty-state.tsx` para estado vazio da lista

## 6. Formulário de Criação/Edição de Lead

- [x] 6.1 Criar `src/features/leads/schemas/lead-schema.ts` com validação Zod para todos os campos do lead
- [x] 6.2 Criar `src/features/leads/components/viacep-address-fields.tsx` com campos de endereço e integração ViaCEP (fetch ao blur do CEP, spinner de loading, erro gracioso)
- [x] 6.3 Criar `src/features/leads/components/lead-form-sheet.tsx` (Sheet + TanStack Form) para criação e edição de lead, reutilizando `ViacepAddressFields`

## 7. Painel de Detalhes do Lead

- [x] 7.1 Criar `src/features/leads/components/lead-detail-sheet.tsx` com Sheet que abre ao clicar no card, sincronizado via nuqs `?lead=<id>`
- [x] 7.2 Criar `src/features/leads/components/lead-contacts-section.tsx` com listagem de contatos e ações inline de adicionar/editar/remover
- [x] 7.3 Criar `src/features/leads/components/contact-form.tsx` (mini-form inline ou dialog) para criar/editar contato
- [x] 7.4 Criar `src/features/leads/components/lead-comments-section.tsx` com thread de comentários, campo de novo comentário e ações de editar/deletar
- [x] 7.5 Criar `src/features/leads/components/lead-info-section.tsx` com dados gerais, endereço e select de status inline

## 8. Página de Leads e View Principal

- [x] 8.1 Criar rota `src/app/dashboard/comercial/leads/page.tsx` com `PageContainer`, botão "Novo Lead" e `LeadsView`
- [x] 8.2 Criar `src/features/leads/components/leads-view.tsx` que compõe `LeadsFilters`, grid de `LeadCard`, `LeadDetailSheet` e `LeadFormSheet`

## 9. Refinamentos de UI e Responsividade

- [x] 9.1 Garantir grid responsivo na lista de leads: 1 col mobile, 2 col `sm:`, 3 col `lg:`
- [x] 9.2 Garantir que o Sheet de detalhes seja `side="right"` com largura adequada (`w-full sm:max-w-xl`) e scroll interno
- [x] 9.3 Verificar contraste e acessibilidade dos dots de status (aria-label com o texto do status)
- [x] 9.4 Adicionar skeleton de loading para o grid de cards e para o painel de detalhes
