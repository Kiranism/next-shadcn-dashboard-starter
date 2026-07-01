## Context

O dashboard WattDash já consome a WattAPI via `api-client.ts` com funções `apiGet/apiPost/apiPatch`. O Supabase é usado para autenticação; o cliente browser (`createClient()` de `@/utils/supabase/client`) está disponível em qualquer componente client-side. A WattAPI espera que o frontend faça upload de comprovantes direto ao bucket Supabase `reimbursement-receipts` _antes_ de chamar `POST /reimbursements`, enviando apenas os storage paths no body. Charts já são usados na aplicação via Recharts.

## Goals / Non-Goals

**Goals:**
- Submissão de reembolsos com upload de comprovantes para Supabase Storage
- Visualização e acompanhamento das próprias solicitações
- Painel administrativo com filtros, gráficos agregados (por valor) e ações do presidente
- Máxima responsividade — mobile-first em todos os componentes

**Non-Goals:**
- Endpoint de analytics dedicado — agregação feita client-side
- Edição de solicitações após envio (a API não suporta)
- Download de comprovantes via UI (apenas links signed_url já gerados pela API)
- Push notifications sobre mudança de status (escopo futuro)

## Decisions

### 1. Upload antes do POST
**Decisão:** Upload direto ao Supabase Storage via cliente browser, coletando os paths, depois `POST /reimbursements`.

**Rationale:** A API exige essa ordem. Usar `supabase.storage.from('reimbursement-receipts').upload(path, file)` com path `receipts/${userId}/${crypto.randomUUID()}/${file.name}`. O `userId` vem da sessão (`useSession`).

**Alternativa considerada:** Server Action como proxy de upload — descartada, adiciona latência e duplicação.

### 2. Estado do upload no form
**Decisão:** Estado local no componente do dialog: `{ file: File, status: 'pending' | 'uploading' | 'done' | 'error', path?: string }[]`. Submit só é habilitado quando todos os uploads terminam ou não há arquivos.

**Rationale:** Mantém a lógica auto-contida sem necessidade de store global.

### 3. Agregação de dados para gráficos
**Decisão:** `GET /reimbursements?target=all` + `GET /users` → join client-side por `user_id` dentro de um `useMemo`.

**Rationale:** Não existe endpoint de analytics. Superusers já têm acesso a ambos. UserRepository.useAll() provavelmente já está cacheado. O volume de dados é pequeno o suficiente para aggregation client-side sem impacto perceptível.

### 4. Estrutura de repositório
**Decisão:** Seguir o padrão existente: `src/repositories/reembolsos.repository.ts` com hooks nomeados como `ReembolsosRepository.useOwn()`, `.useAll()`, `.useUpdateStatus()`.

### 5. Ícone para Reembolsos
**Decisão:** Adicionar `IconReceipt` do `@tabler/icons-react` ao `icons.tsx` com chave `receipt`.

### 6. Controle de Reembolsos na nav
**Decisão:** Grupo "Administração", `minRank: 3`. O Presidente vê a página igual ao Assessor, mas com botões de ação habilitados (condicional por `rank >= 4` dentro do componente).

## Risks / Trade-offs

**[Bucket não existe]** → O bucket `reimbursement-receipts` precisa ser criado manualmente no Supabase antes do deploy. Mitigação: documentar no AGENTS.md ou README.

**[signed_url expira em 1h]** → Se o usuário deixa a lista aberta por mais de 1h e tenta acessar um comprovante, o link estará expirado. Mitigação: o usuário pode recarregar a página. Não justifica invalidação automática dado o escopo.

**[Agregação client-side com muitos reembolsos]** → Se o volume crescer muito (>1000 registros), a performance pode degradar. Mitigação: implementar paginação ou filtro server-side quando necessário — fora de escopo agora.

**[Upload parcial]** → Se o usuário faz upload de 3 arquivos e fecha o dialog, os arquivos já enviados ficam no bucket órfãos. Mitigação: paths gerados com UUID único; custo de storage é mínimo; cleanup pode ser feito por cron no futuro.
