## Context

O WattDash usa exclusivamente dados mock via `src/constants/mock-api-*.ts`. O wattapi é um NestJS separado, rodando em localhost:3001 (dev) ou em produção, que expõe todos os dados reais via REST. A autenticação é Supabase: o frontend obtém um JWT da sessão e o backend valida esse JWT para resolver o usuário e seu role no banco.

O role não está no JWT — está apenas no banco. Portanto, o frontend precisa buscar o perfil em `/auth/me` após o login para saber o role e aplicar RBAC.

## Goals / Non-Goals

**Goals:**
- Remover todo código de boilerplate (mocks, páginas e features template)
- Criar uma camada HTTP reutilizável que injeta o bearer token automaticamente
- Expor role e perfil do usuário via context no frontend
- Filtrar nav e bloquear rotas por rank do role
- Implementar a página Ponto Eletrônico conectada ao wattapi real

**Non-Goals:**
- Não implementar outras features além do Ponto Eletrônico neste change
- Não criar um sistema de permissões granular por ação (apenas por rank)
- Não adicionar testes e2e

## Decisions

### 1. API client como função utilitária, não classe

**Decisão**: `src/lib/api-client.ts` exporta funções `apiGet`, `apiPost`, `apiPatch`, `apiDelete` que recebem o token como parâmetro, em vez de um singleton com estado.

**Porquê**: No Next.js com Server Components e Client Components, um singleton com estado de autenticação causa problemas de hidratação e SSR. Funções puras são testáveis e composáveis. O token vem do `useSession()` no cliente ou do `createClient()` do Supabase no servidor.

**Alternativa descartada**: Axios instance com interceptor — adiciona dependência desnecessária; fetch nativo é suficiente.

### 2. Perfil do usuário: busca no cliente, não no servidor

**Decisão**: `UserProfileProvider` (Client Component) busca `/auth/me` via React Query na montagem, após detectar sessão ativa. Não usa RSC para essa busca.

**Porquê**: O role afeta rendering em toda a árvore do cliente (nav, guards). Buscar no servidor e passar via props criaria prop drilling ou exigiria múltiplos `layout.tsx` aninhados. React Query já é o padrão do projeto e provê cache/refetch automático.

**Alternativa descartada**: Buscar em `middleware.ts` e injetar em header — acoplamento entre middleware e API externa; falha silenciosa difícil de debugar.

### 3. RBAC via minRank em nav-config + guard de layout

**Decisão**: Cada `NavItem` e `NavGroup` recebe uma propriedade opcional `minRank: number`. O hook `useFilteredNavGroups` filtra com base no `userProfile.rank`. Para proteção de rota, um `RoleGuard` Client Component no `layout.tsx` do dashboard redireciona se o rank for insuficiente.

**Porquê**: Centraliza as regras de acesso no `nav-config.ts` (mesmo arquivo que define as rotas), evitando dispersão. O `RoleGuard` no layout garante proteção mesmo se o usuário acessa a URL diretamente.

**Alternativa descartada**: Middleware de Next.js para RBAC — o role requer chamada ao wattapi, o que não pode ser feito de forma confiável no edge middleware sem aumentar latência em todas as requisições.

### 4. Ponto Eletrônico: tabela de usuários apenas para superusers via flag na query

**Decisão**: A página `PontoEletronicoPage` verifica `userProfile.rank >= 3` para decidir se renderiza a seção de superuser. As queries de `/users` e `/time-entries/summary/:userId` só são feitas se o usuário é superuser (usando `enabled: isSuperuser` no React Query).

**Porquê**: Simples, sem componentes separados para cada view. O wattapi já valida no backend — o frontend só evita chamadas desnecessárias.

## Risks / Trade-offs

- **Race condition no carregamento do perfil** → Mitigação: exibir skeleton/loader enquanto `userProfile` é `null`; nunca mostrar rota protegida antes do perfil carregar
- **Token expirado em chamadas ao wattapi** → Mitigação: o Supabase SDK renova o token via `getSession()`; o api-client sempre busca a sessão atual antes de cada request
- **Wattapi offline em dev** → Mitigação: React Query mostra estado de erro; não bloqueia o carregamento do app
- **`NEXT_PUBLIC_API_URL` não configurado** → Mitigação: valor padrão de `http://localhost:3001` em dev com warning no console

## Migration Plan

1. Remover arquivos de boilerplate (sem efeito em produção — não estão linkados em nav)
2. Adicionar `NEXT_PUBLIC_API_URL` ao `.env.local` e `env.example.txt`
3. Implementar api-client, UserProfileProvider, nav RBAC
4. Implementar Ponto Eletrônico
5. Atualizar nav-config com os novos itens e `minRank`

Rollback: os arquivos removidos estão no git; qualquer commit pode ser revertido.
