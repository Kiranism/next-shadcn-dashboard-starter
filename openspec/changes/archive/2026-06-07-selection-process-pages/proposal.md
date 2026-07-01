## Why

A Watt precisa de um fluxo completo de processo seletivo: uma página pública onde candidatos podem se inscrever, e um painel interno onde membros autenticados acompanham e gerenciam as candidaturas e os processos. Hoje nenhuma dessas interfaces existe no dashboard.

## What Changes

- Nova página pública `/inscricao` — formulário de candidatura para o processo seletivo ativo, sem autenticação
- Nova página interna `/psel` — painel de gestão de processos seletivos com duas abas:
  - **Processos**: lista de processos seletivos; assessor/presidente podem criar e editar
  - **Candidaturas**: visualização das candidaturas por processo; assessor/presidente podem atualizar status
- Navegação: `/psel` adicionada ao sidebar para todos os usuários autenticados; `/inscricao` não aparece na navegação

## Capabilities

### New Capabilities

- `selection-process-management`: Gestão de processos seletivos (listar, criar, editar) e candidaturas (listar, atualizar status)
- `public-application-form`: Formulário público de inscrição no processo seletivo ativo, com upload de arquivos para o Supabase Storage

### Modified Capabilities

## Impact

- Novas rotas Next.js: `app/(public)/inscricao/page.tsx` (sem autenticação) e `app/(dashboard)/psel/page.tsx`
- Nova camada de API: `features/selection-process/api/` com types, service e queries
- Upload de arquivos para bucket `selection-process-files` no Supabase Storage
- Interações com endpoints: `GET/POST/PATCH /selection-process`, `GET/POST/PATCH /selection-process/applications`
- Adição de item no sidebar: `psel` acessível a todos os roles autenticados
