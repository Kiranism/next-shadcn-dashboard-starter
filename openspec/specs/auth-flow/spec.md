# Auth Flow

Documenta o fluxo completo de autenticação do WattDash, desde o acesso à URL até o dashboard.

## Visão geral

A autenticação usa **Supabase Auth** para identidade (Google OAuth exclusivo) e o **wattapi** para perfil de aplicação (name, role, sector, cpf). São dois sistemas independentes — ter sessão Supabase não implica ter perfil no wattapi.

```
Supabase Auth  →  identidade (UUID, email, JWT)
wattapi        →  perfil     (name, role, sector, cpf)
```

## Arquivos-chave

| Arquivo | Responsabilidade |
|---|---|
| `src/proxy.ts` | Ponto de entrada do middleware Next.js |
| `src/utils/supabase/middleware.ts` | Proteção de rotas por sessão |
| `src/app/auth/sign-in/page.tsx` | Página de login (só Google OAuth) |
| `src/features/auth/components/google-auth-button.tsx` | Botão OAuth |
| `src/app/auth/callback/route.ts` | Troca code→session após OAuth |
| `src/components/providers/session-provider.tsx` | Contexto da sessão Supabase |
| `src/components/providers/user-profile-provider.tsx` | Contexto do perfil wattapi |
| `src/components/layout/onboarding-gate.tsx` | Guarda de onboarding no dashboard |
| `src/app/onboarding/page.tsx` | Formulário de criação de perfil |

## Requirements

### Requirement: Proteção de rotas via middleware
O middleware SHALL proteger as rotas `/dashboard/*` e `/onboarding` exigindo sessão Supabase ativa. Rotas `/auth/*` SHALL redirecionar usuários já autenticados para `/dashboard`.

#### Scenario: Acesso sem sessão a rota protegida
- **WHEN** um usuário sem sessão acessa qualquer rota sob `/dashboard` ou `/onboarding`
- **THEN** o middleware SHALL redirecionar para `/auth/sign-in`

#### Scenario: Acesso autenticado a rota de auth
- **WHEN** um usuário com sessão ativa acessa qualquer rota sob `/auth`
- **THEN** o middleware SHALL redirecionar para `/dashboard`

#### Scenario: Rotas públicas
- **WHEN** um usuário acessa `/`, `/onboarding` com sessão, ou qualquer rota não protegida
- **THEN** o middleware SHALL deixar a requisição passar sem redirecionar

### Requirement: Login exclusivo via Google OAuth
A página `/auth/sign-in` SHALL exibir apenas o botão de login com Google. Não há formulário email/senha exposto na interface.

#### Scenario: Início do fluxo OAuth
- **WHEN** o usuário clica em "Continue with Google"
- **THEN** o frontend SHALL chamar `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '{origin}/auth/callback' } })` e o browser SHALL ser redirecionado para o Google

### Requirement: Callback de autenticação
A rota `GET /auth/callback` SHALL processar o retorno do Google OAuth, trocando o `code` por uma sessão Supabase ou repassando erros para a página de sign-in.

#### Scenario: Callback com erro do Google/Supabase
- **WHEN** o Google retorna `?error=...&error_description=...` na callback
- **THEN** SHALL redirecionar para `/auth/sign-in?error={error}&error_description={description}`

#### Scenario: Callback com code válido
- **WHEN** a callback recebe `?code=...`
- **THEN** SHALL chamar `exchangeCodeForSession(code)` e, em caso de sucesso, redirecionar para `/dashboard`

#### Scenario: Callback sem code e sem error
- **WHEN** a callback não recebe nem `code` nem `error`
- **THEN** SHALL redirecionar para `/auth/sign-in?error=no_code`

### Requirement: Onboarding de novos usuários
Usuários que completaram o OAuth mas ainda não possuem perfil no wattapi SHALL ser redirecionados para `/onboarding` antes de acessar o dashboard.

#### Scenario: Detecção de perfil ausente
- **WHEN** o `UserProfileProvider` detecta sessão ativa mas `GET /auth/me` retorna erro
- **THEN** `profileMissing` SHALL ser `true` e o `OnboardingGate` SHALL redirecionar para `/onboarding`

#### Scenario: Criação de perfil no onboarding
- **WHEN** o usuário preenche nome, setor e CPF e submete o formulário
- **THEN** o frontend SHALL chamar `POST /users` com o bearer token, invalidar a query `['auth', 'me']` e redirecionar para `/dashboard/ponto`

#### Scenario: Promoção automática de usuário bootstrap
- **WHEN** o email do novo perfil é `yan.lima@wattconsultoria.com.br`
- **THEN** o trigger `trg_promote_bootstrap_superusers` SHALL promover o role para `presidente` antes do INSERT ser commitado

### Requirement: Mensagens de erro OAuth
A página `/auth/sign-in` SHALL exibir mensagens específicas para cada tipo de erro OAuth recebido via query params.

#### Scenario: Erro access_denied
- **WHEN** `?error=access_denied` está presente na URL
- **THEN** SHALL exibir toast: "Acesso negado pelo Google. Verifique se seu e-mail está na lista de usuários autorizados."

#### Scenario: Erro exchange_failed
- **WHEN** `?error=exchange_failed` está presente
- **THEN** SHALL exibir "Falha ao trocar o código de autenticação." com a `error_description` como detalhe no toast
