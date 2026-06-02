## Context

O WattDash é um Next.js 16 App Router com shadcn/ui, TanStack React Query, TanStack Form + Zod e serviço de API REST próprio (`api-client.ts`). A autenticação usa Supabase token e o perfil do usuário expõe `role`, `sector` e `rank`. O sistema de navegação atual só filtra por `minRank`; não há suporte a filtro por `sector`.

## Goals / Non-Goals

**Goals:**
- Implementar `GET/POST/PATCH/DELETE /leads` e sub-recursos (`/contacts`, `/comments`) usando a camada `types.ts → service.ts → queries.ts`
- Implementar `GET/POST/PATCH/DELETE /portfolio`
- Card de lead reformulado conforme relatório interno: contato principal, telefone, serviços, indicador de contatos adicionais, dot colorido de status
- Filtros de status na lista de leads com contagem por grupo
- ViaCEP para autocompletar endereço no formulário de lead
- RBAC de navegação extensível por `sector`

**Non-Goals:**
- Kanban / pipeline visual de leads (fora do escopo da proposta atual)
- Notificações automáticas por mudança de status de lead
- Exportação de leads para CSV

## Decisions

### 1. Feature structure — `features/leads/` e `features/portfolio/` separados
Cada feature segue o padrão `api/types.ts → api/service.ts → api/queries.ts → components/`. A separação evita acoplamento desnecessário e mantém a convenção do projeto.

### 2. Estado da lista de leads — React Query + nuqs
A listagem usa `useQuery` (não Suspense, pois há filtros client-side via nuqs) com `useQueryState` para o filtro de status na URL. Isso mantém o filtro bookmarkável sem round-trip de servidor.

### 3. Detalhes do lead — Sheet lateral (não página separada)
Clicar num card abre um `<Sheet>` com os detalhes completos (contacts, comments, endereço), evitando navegação de página e mantendo o contexto da lista visível. O `GET /leads/:id` é chamado apenas ao abrir o sheet (lazy).

### 4. Formulário de lead — Sheet com TanStack Form + Zod
Uso de `useAppForm` + `useFormFields<T>()` conforme convenção do projeto. A integração ViaCEP dispara um `fetch` ao blur do campo CEP e preenche os campos de endereço automaticamente.

### 5. RBAC de navegação — extensão de `NavItem` com `allowedSectors`
Adicionar `allowedSectors?: string[]` a `NavItem` e atualizar `useFilteredNavGroups` para permitir o item se `rank >= minRank OR sector in allowedSectors`. Isso é suficiente para o caso de uso atual sem generalizar demais.

### 6. Status de lead — três valores snake_case
Implementar `nao_contatado`, `em_progresso`, `finalizado` conforme proposta do relatório interno. Os labels PT-BR e cores são definidos no frontend. O PATCH `/leads/:id` aceita esses valores via `status` field.

### 7. Portfolio — lista + modal de CRUD inline
Portfolio usa lista simples com cards. Ações de criar/editar abrem um `<Dialog>` simples (não sheet, pois o formulário é pequeno: name + description). Delete usa `AlertDialog` de confirmação.

## Risks / Trade-offs

- **ViaCEP timeout** → Mostrar estado de loading no campo CEP e não bloquear o submit se a API falhar; campos de endereço permanecem editáveis manualmente.
- **RBAC de nav por sector no lado client** → Como toda RBAC de nav, é apenas UX. A segurança real é garantida pela API (retorna 403). Documentar isso claramente.
- **Sheet de detalhes com re-fetch** → Cada abertura de sheet faz `GET /leads/:id`. Com `staleTime` adequado (30s) isso é aceitável para dados de leads que mudam com pouca frequência.
- **Leads sem contatos** → O card exibe "Nenhum contato" em vez de travar. O formulário de criação de lead não requer contatos; eles são adicionados no sheet de detalhes.
