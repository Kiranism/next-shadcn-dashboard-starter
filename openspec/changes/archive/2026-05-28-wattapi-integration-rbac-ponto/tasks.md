## 1. Limpeza de Boilerplate

- [x] 1.1 Remover `src/app/dashboard/overview/` e todos os slots paralelos (@area_stats, @bar_stats, @pie_stats, @sales)
- [x] 1.2 Remover `src/app/dashboard/product/` e `src/app/dashboard/product/[productId]/`
- [x] 1.3 Remover `src/app/about/`, `src/app/privacy-policy/`, `src/app/terms-of-service/`
- [x] 1.4 Remover `src/features/overview/`
- [x] 1.5 Remover `src/features/products/`
- [x] 1.6 Remover `src/constants/mock-api.ts` e `mock-api-*.ts` não utilizados após limpeza
- [x] 1.7 Atualizar `src/config/nav-config.ts` removendo itens de boilerplate (Overview, Product)
- [x] 1.8 Atualizar `src/app/dashboard/page.tsx` para redirecionar para `/dashboard/ponto`

## 2. API Client

- [x] 2.1 Adicionar `NEXT_PUBLIC_API_URL=http://localhost:3001` ao `.env.local` e `env.example.txt`
- [x] 2.2 Criar `src/lib/api-client.ts` com funções `apiGet`, `apiPost`, `apiPatch`, `apiDelete` genéricas
- [x] 2.3 Implementar injeção automática de `Authorization: Bearer <token>` e tratamento de erro HTTP

## 3. Perfil do Usuário e Context

- [x] 3.1 Criar `src/types/user-profile.ts` com tipos `UserProfile`, `Role`, `ROLE_RANK`
- [x] 3.2 Criar `src/features/auth/api/queries.ts` com `userProfileQueryOptions` consumindo `/auth/me`
- [x] 3.3 Criar `src/components/providers/user-profile-provider.tsx` com `UserProfileContext` e `UserProfileProvider`
- [x] 3.4 Exportar hook `useUserProfile()` retornando `{ profile, isLoading, rank }`
- [x] 3.5 Adicionar `UserProfileProvider` ao `src/components/layout/providers.tsx`, dentro do `SessionProvider`

## 4. RBAC de Navegação e Rotas

- [x] 4.1 Estender tipos `NavItem` e `NavGroup` em `src/types/index.ts` com `minRank?: number`
- [x] 4.2 Implementar filtragem por `minRank` em `useFilteredNavGroups` e `useFilteredNavItems` em `src/hooks/use-nav.ts`
- [x] 4.3 Criar `src/components/layout/role-guard.tsx` — Client Component que redireciona para `/dashboard` se rank insuficiente
- [x] 4.4 Atualizar `src/config/nav-config.ts` com os novos itens reais e `minRank` onde aplicável

## 5. Página Ponto Eletrônico

- [x] 5.1 Criar `src/app/dashboard/ponto/page.tsx` (Server Component com metadata e PageContainer)
- [x] 5.2 Criar `src/features/ponto-eletronico/api/types.ts` com tipos `TimeEntry`, `WeeklySummary`, `ClockInResponse`
- [x] 5.3 Criar `src/features/ponto-eletronico/api/queries.ts` com query options para `/time-entries/summary/me` e `/time-entries/summary/:userId`
- [x] 5.4 Criar `src/features/ponto-eletronico/api/service.ts` com funções `clockIn()` e `clockOut()`
- [x] 5.5 Criar componente `ClockInOutButton` com estado derivado do resumo atual
- [x] 5.6 Criar componente `WeeklySummaryCard` para exibir resumo pessoal semanal
- [x] 5.7 Criar componente `UsersSuperuserTable` que busca `/users` e exibe listagem da equipe (só renderiza se rank >= 3)
- [x] 5.8 Criar componente `UserWeeklySummaryPanel` para detalhar resumo de um usuário selecionado
- [x] 5.9 Montar `PontoEletronicoView` compondo todos os componentes acima
- [x] 5.10 Adicionar item "Ponto Eletrônico" ao nav-config com url `/dashboard/ponto`
