## Why

O WattDash está desconectado do backend (wattapi): usa apenas dados mock, não tem controle de acesso por role, e carrega páginas de boilerplate irrelevantes. Com o wattapi estável e o Google OAuth funcionando, é o momento de conectar os dois e entregar a primeira feature real do produto.

## What Changes

- **Remoção de boilerplate**: deletar todas as páginas de template que não fazem parte do produto (overview, products, about, privacy-policy, terms-of-service e features associadas)
- **Integração com wattapi**: substituir mock APIs por chamadas reais aos endpoints do wattapi, passando o bearer token da sessão Supabase
- **Perfil do usuário via wattapi**: após o login, buscar o perfil completo (incluindo `role`) em `/auth/me` e disponibilizar no contexto da aplicação
- **RBAC no dashboard**: filtrar itens de navegação e bloquear acesso a rotas com base no rank do role do usuário (`consultor=0` … `presidente=4`)
- **Página Ponto Eletrônico**: feature de registro de ponto com clock-in/clock-out para todos os usuários autenticados, visualização de resumo pessoal, e listagem de usuários + resumos de toda a equipe exclusiva para superusers (rank ≥ 3)

## Capabilities

### New Capabilities

- `wattapi-client`: Camada de integração HTTP com o wattapi — cliente base com injeção automática do bearer token, tratamento de erros e base URL configurável por ambiente
- `user-profile-context`: Busca e armazenamento do perfil completo do usuário (incluindo role e rank) via `/auth/me` após autenticação, exposto via React Context e hook `useUserProfile`
- `nav-rbac`: Filtragem de grupos e itens de navegação com base no rank do usuário; bloqueio de acesso a rotas protegidas com redirect para 403 ou dashboard
- `ponto-eletronico`: Página de Ponto Eletrônico em `/dashboard/ponto` com clock-in/clock-out, resumo pessoal semanal, e painel de superuser com listagem de usuários e seus resumos

### Modified Capabilities

## Impact

- **Removidos**: `src/app/dashboard/overview/`, `src/app/dashboard/product/`, `src/app/about/`, `src/app/privacy-policy/`, `src/app/terms-of-service/`, `src/features/overview/`, `src/features/products/`, `src/features/users/` (substituída por versão real)
- **Modificados**: `src/components/layout/providers.tsx` (adiciona UserProfileProvider), `src/hooks/use-nav.ts` (adiciona filtragem por rank), `src/config/nav-config.ts` (adiciona propriedade `minRank` por item/grupo)
- **Adicionados**: `src/lib/api-client.ts`, `src/features/ponto-eletronico/`, `src/features/users/` (versão real), contexto de perfil
- **Dependências**: nenhuma nova — usa React Query e padrões já existentes no projeto
- **Ambiente**: `NEXT_PUBLIC_API_URL` deve apontar para o wattapi (localhost:3001 em dev, produção em prod)
