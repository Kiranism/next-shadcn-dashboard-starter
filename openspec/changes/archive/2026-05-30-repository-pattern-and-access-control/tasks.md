## 1. Infraestrutura base dos repositories

- [x] 1.1 Criar `src/repositories/_shared/use-access-token.ts` — hook que retorna `session?.access_token ?? ''` via `useSession()`
- [x] 1.2 Criar estrutura de pastas `src/repositories/` com arquivo `index.ts` de barrel export

## 2. UserRepository

- [x] 2.1 Criar `src/repositories/users.repository.ts` com keys privados (`all`, `one`)
- [x] 2.2 Implementar funções assíncronas puras: `getAll(token)`, `getOne(token, id)`, `updateOne(token, id, data)` usando `apiGet`/`apiPatch`
- [x] 2.3 Implementar hook `useAll()` usando `useSuspenseQuery` + `useAccessToken()`
- [x] 2.4 Implementar hook `useOne(id)` usando `useSuspenseQuery` + `useAccessToken()`
- [x] 2.5 Implementar hook `useUpdateOne()` usando `useMutation` + `useAccessToken()` com invalidação automática de `keys.all()`
- [x] 2.6 Implementar método estático `invalidateAll(queryClient)` para invalidação externa
- [x] 2.7 Migrar `features/users/` e `features/ponto-eletronico/` para usar `UserRepository` — remover imports de `features/*/api/`

## 3. TimeEntriesRepository

- [x] 3.1 Criar `src/repositories/time-entries.repository.ts` com keys privados
- [x] 3.2 Implementar funções puras: `getMySummary(token)`, `getUserSummary(token, userId)`, `getTeamWeek(token, weekOffset)`, `clockIn(token)`, `clockOut(token)`
- [x] 3.3 Implementar hook `useMySummary()` com `refetchInterval: 60_000`
- [x] 3.4 Implementar hook `useUserSummary(userId)`
- [x] 3.5 Implementar hook `useTeamWeek(weekOffset)` com `refetchInterval` condicional (só quando `weekOffset === 0`)
- [x] 3.6 Implementar hooks de mutação `useClockIn()` e `useClockOut()` com invalidação do summary
- [x] 3.7 Migrar `features/ponto-eletronico/` para usar `TimeEntriesRepository`

## 4. SettingsRepository

- [x] 4.1 Criar `src/repositories/settings.repository.ts` com keys privados
- [x] 4.2 Implementar função pura `get(token)` e hook `useSettings()`
- [x] 4.3 Implementar hook `useUpdateSettings()` com `useMutation` e `setQueryData` para update otimista
- [x] 4.4 Migrar `features/ponto-eletronico/` para usar `SettingsRepository`

## 5. Limpeza das feature api/ folders

- [x] 5.1 Remover `features/ponto-eletronico/api/queries.ts` e `features/ponto-eletronico/api/service.ts`
- [x] 5.2 Remover `features/users/api/queries.ts` e `features/users/api/service.ts`
- [x] 5.3 Remover `features/auth/api/queries.ts` (migrado para `UserRepository` ou `AuthRepository` se necessário)
- [x] 5.4 Mover tipos de domínio de `features/*/api/types.ts` para `src/types/` ou junto ao repository correspondente

## 6. Cookie de role para middleware

- [x] 6.1 Criar route handler (ou server action) `src/app/api/auth/set-role-cookie/route.ts` que recebe o `role` e seta cookie httpOnly `wattdash-role`
- [x] 6.2 Chamar o set de cookie em `UserProfileProvider` após carregamento bem-sucedido do perfil
- [x] 6.3 Atualizar o cookie em `UserRepository.useUpdateOne()` após mutação bem-sucedida que altere `role`

## 7. Middleware com proteção por role

- [x] 7.1 Criar helper `src/config/nav-config.utils.ts` com função `getMinRankForPath(pathname: string): number | null` que lê `nav-config.ts`
- [x] 7.2 Criar helper `getRankFromRole(role: string): number` reutilizando `ROLE_RANK` de `src/types/user-profile.ts`
- [x] 7.3 Atualizar `src/utils/supabase/middleware.ts` para ler cookie `wattdash-role`, calcular rank e redirecionar para `/dashboard/ponto` se `rank < minRank`
- [x] 7.4 Garantir fallback: se cookie ausente e usuário autenticado, permitir acesso (delega ao `RoleGuard`)

## 8. KBar filtrada por role

- [x] 8.1 Auditar `src/components/kbar/` para entender como as ações de navegação são geradas atualmente
- [x] 8.2 Refatorar geração de ações da kbar para usar `useFilteredNavGroups()` (ou a mesma lógica de filtragem da navbar) em vez de lista hardcoded
- [x] 8.3 Verificar que páginas com `minRank` superior ao rank do usuário não aparecem nos resultados da kbar

## 9. Validação end-to-end

- [ ] 9.1 Testar como usuário `consultor` (rank 0): navbar não exibe `/users`, kbar não exibe `/users`, acesso direto à URL redireciona para `/ponto`
- [ ] 9.2 Testar como usuário `assessor` (rank 3): navbar exibe `/users`, kbar exibe `/users`, acesso direto funciona
- [ ] 9.3 Verificar que clock-in/clock-out funcionam corretamente via `TimeEntriesRepository`
- [ ] 9.4 Verificar que update de usuário invalida cache e re-renderiza tabela
- [ ] 9.5 Verificar que prefetch server-side continua funcionando (sem regressão de SSR)

<!-- Note: Tasks 9.1-9.5 require manual testing in a running app with real users -->
