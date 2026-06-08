## Context

O projeto usa Next.js 16 (App Router) com Clerk para autenticação. Rotas no grupo `app/dashboard/` ficam por trás do `OnboardingGate` com sidebar. Rotas públicas (ex: `app/auth/`) têm layout próprio sem sidebar. Toda interação com a API passa pelo `api-client.ts` + repositories em `src/repositories/`. O Supabase é usado apenas para storage.

Processos seletivos envolvem dois fluxos completamente distintos:
1. **Candidato externo** → página pública sem autenticação, envia candidatura
2. **Membro interno** → painel autenticado, gerencia processos e candidaturas

## Goals / Non-Goals

**Goals:**
- Página `/inscricao` pública, responsiva, sem sidebar, com upload de 3 arquivos para `selection-process-files`
- Página `/psel` no dashboard com duas tabs: Processos (CRUD restrito) e Candidaturas (leitura + atualização de status)
- Adicionar `/psel` na navegação sem restrição de role
- Seguir exatamente os padrões de repositório, tipos e componentes do projeto

**Non-Goals:**
- Autenticação ou login para candidatos externos
- Preview inline dos arquivos enviados
- Notificações automáticas por email ao candidato (controladas pela API)
- Filtros avançados além de `?selection_process_id=uuid`

## Decisions

### D1 — Rota pública em `app/inscricao/`

A rota pública fica em `src/app/inscricao/page.tsx` com layout próprio (`layout.tsx`) sem sidebar/header. Isso isola a rota do grupo `dashboard` e do `OnboardingGate` sem criar um route group adicional.

Alternativa considerada: criar `(public)` route group — desnecessário, pois há apenas uma rota pública nova.

### D2 — Upload multi-arquivo com validação de tipo

Os 3 arquivos (currículo, histórico, foto) são tratados como campos independentes no formulário, não um array genérico. Isso garante labels claros, validações de tipo específicas (PDF para currículo/histórico, imagem para foto) e mapeia exatamente ao body da API.

Paths no formato `{uuid}/{resume|transcript|photo}.{ext}` conforme exigido pela API. UUID gerado no cliente com `crypto.randomUUID()`.

### D3 — Formulário público sem TanStack Form

A página pública não usa `useAppForm` pois não tem autenticação Clerk e não deve importar dependências do dashboard. Usa `react-hook-form` + `zod` diretamente (disponíveis no projeto via shadcn/forms).

Alternativa: TanStack Form — descartada porque `useFormFields` depende do `UserProfileProvider` indiretamente via importações do projeto.

### D4 — Repository para selection-process

Novo arquivo `src/repositories/selection-process.repository.ts` seguindo exatamente o padrão dos demais (keys factory, funções async puras, hooks com `useAccessToken`, export como objeto). Inclui um `apiPost` sem token para o endpoint público de candidaturas (passando `null` como token, o api-client lança 401 — por isso a rota pública de POST `/selection-process/applications` chama `fetch` direto).

### D5 — Chamada pública à API sem token

O endpoint `POST /selection-process/applications` é público (sem auth). O `api-client.ts` atual rejeita chamadas sem token. Para a página de inscrição, fazemos `fetch` diretamente sem token. Criamos uma função utilitária `apiPostPublic` no contexto da feature.

### D6 — Psel page com tabs (padrão hogwatts)

Segue exatamente o padrão `GamificationView`: `Tabs` + `TabsList` com overflow-x, tabs condicionais por role. Tab "Processos" visível a todos, com botão criar/editar apenas para rank ≥ 3. Tab "Candidaturas" visível a todos, atualização de status apenas para rank ≥ 3.

## Risks / Trade-offs

- [Upload antes do POST] Se o upload para o Storage falhar parcialmente, arquivos órfãos ficam no bucket → Mitigação: mostrar erro granular por arquivo, não continuar o POST se algum upload falhar
- [CNPJ no form público] A API valida CNPJ com algoritmo da Receita Federal — usar a mesma função `format-cnpj.ts` existente no projeto para validação no frontend
- [Processo ativo] O endpoint público retorna 404 se não há processo ativo — tratar explicitamente com mensagem "Não há processo seletivo ativo no momento"
- [Tamanho de arquivos] Sem limite definido pela API — aplicar limite de 10 MB por arquivo no frontend para evitar uploads longos

## Migration Plan

1. Criar tipos `src/types/selection-process.ts`
2. Criar repository `src/repositories/selection-process.repository.ts` + exportar em `index.ts`
3. Criar feature `src/features/selection-process/`
4. Criar rota pública `src/app/inscricao/`
5. Criar rota dashboard `src/app/dashboard/psel/`
6. Adicionar item ao `nav-config.ts`

Rollback: remover arquivos criados + remover entrada do nav-config. Sem migrações de banco ou mudanças em endpoints existentes.
