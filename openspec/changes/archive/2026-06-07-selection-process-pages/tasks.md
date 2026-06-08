## 1. Tipos e Repository

- [x] 1.1 Criar `src/types/selection-process.ts` com interfaces `SelectionProcess`, `SelectionProcessApplication`, `CreateSelectionProcessPayload`, `UpdateSelectionProcessPayload`, `UpdateApplicationStatusPayload`
- [x] 1.2 Criar `src/repositories/selection-process.repository.ts` com keys factory, funções async e hooks para `GET/POST/PATCH /selection-process` e `GET/PATCH /selection-process/applications`
- [x] 1.3 Exportar o novo repository em `src/repositories/index.ts`

## 2. Feature — Página Interna `/psel`

- [x] 2.1 Criar `src/features/selection-process/components/process-form-dialog.tsx` — dialog de criar/editar processo com validação de datas via zod
- [x] 2.2 Criar `src/features/selection-process/components/processes-tab.tsx` — lista de processos com cards, badge de status (ativo/encerrado/futuro), botão criar e ação editar para rank ≥ 3
- [x] 2.3 Criar `src/features/selection-process/components/application-status-badge.tsx` — badge colorido por status (pending/approved/rejected/waitlisted)
- [x] 2.4 Criar `src/features/selection-process/components/applications-tab.tsx` — lista de candidaturas com filtro por processo, dados do candidato, controles de status para rank ≥ 3
- [x] 2.5 Criar `src/features/selection-process/components/psel-view.tsx` — componente com Tabs (Processos + Candidaturas), seguindo padrão `GamificationView`
- [x] 2.6 Criar `src/app/dashboard/psel/page.tsx` com `PageContainer` e `PselView`
- [x] 2.7 Adicionar item `{ title: 'Processo Seletivo', url: '/dashboard/psel', icon: 'usersGroup', shortcut: ['p', 's'] }` ao grupo "Geral" em `src/config/nav-config.ts`

## 3. Feature — Página Pública `/inscricao`

- [x] 3.1 Criar `src/features/selection-process/lib/upload-application-files.ts` — upload dos 3 arquivos para bucket `selection-process-files` com paths no formato `{uuid}/{resume|transcript|photo}.{ext}`
- [x] 3.2 Criar `src/features/selection-process/lib/api-public.ts` — função `apiPostPublic` para chamada sem token a `POST /selection-process/applications`
- [x] 3.3 Criar `src/features/selection-process/components/inscription/application-form.tsx` — formulário completo com react-hook-form + zod, campos: name, course, period, phone, email, instagram, how_heard, motivation, why_watt, shirt_size, resume (PDF), transcript (PDF), photo (imagem)
- [x] 3.4 Criar `src/features/selection-process/components/inscription/success-screen.tsx` — tela de confirmação após envio bem-sucedido
- [x] 3.5 Criar `src/features/selection-process/components/inscription/no-active-process.tsx` — estado vazio quando não há processo ativo
- [x] 3.6 Criar `src/app/inscricao/layout.tsx` — layout público sem sidebar, com logo e container centralizado
- [x] 3.7 Criar `src/app/inscricao/page.tsx` — verifica processo ativo via `GET /selection-process`, renderiza `ApplicationForm` ou `NoActiveProcess`
