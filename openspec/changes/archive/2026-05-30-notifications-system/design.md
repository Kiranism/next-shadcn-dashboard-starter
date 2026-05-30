## Context

A WattAPI já implementa o ciclo completo de notificações: criação por superusuários (`POST /notifications`), listagem do inbox pessoal (`GET /notifications`) e soft delete individual (`DELETE /notifications/:id`). O frontend WattDash não consume nenhum desses endpoints. O sidebar já tem `SidebarUserFooter` com avatar e botão "Sair" — o ponto de integração natural para a central de notificações é acima desse menu. A página de administração de notificações segue o mesmo padrão da página `Usuários` já existente.

## Goals / Non-Goals

**Goals:**
- Página `/dashboard/notifications` (rank ≥ 3) com formulário para enviar notificações dirigidas por setor e/ou role.
- Central de notificações em `Sheet` lateral acessível via ícone de sino no `SidebarFooter`, acima do avatar.
- Badge numérico sobre o avatar do usuário quando há notificações no inbox (contagem retornada por `GET /notifications`).
- Polling automático leve para manter o badge atualizado sem exigir refresh manual.
- Responsividade completa — o Sheet de notificações deve funcionar em mobile com área de toque adequada.

**Non-Goals:**
- Marcar notificações como "lidas" — a API não tem esse campo; soft delete é a única ação do usuário.
- Notificações em tempo real (WebSocket/SSE) — polling com intervalo é suficiente para o volume atual.
- Histórico de notificações enviadas na página admin.
- Paginação do inbox — a API retorna todas as notificações não deletadas ordenadas por `sent_at DESC`.

## Decisions

### 1. Central como `Sheet` lateral, não `Popover`

**Decisão:** Usar `Sheet` (drawer) ao invés de `Popover` ou modal.  
**Rationale:** Popover fecha ao clicar fora, o que frustra a UX em mobile durante scroll. Sheet oferece área de swipe nativa e não colapsa acidentalmente. A biblioteca shadcn/ui já tem `Sheet` disponível.  
**Alternativa descartada:** `Popover` — ruim em mobile, área de toque insuficiente.

### 2. Trigger da central: ícone de sino no `SidebarFooter`

**Decisão:** Adicionar um `SidebarMenuItem` com ícone `bell` (já disponível em `@/components/icons`) acima do menu de avatar no `SidebarFooter`. O badge numérico aparece tanto no botão do sino quanto sobre o avatar quando o sidebar está colapsado (apenas ícone visível).  
**Rationale:** Manter o padrão de acessibilidade do sidebar colapsável — em modo ícone, o badge sobre o avatar é o único indicador visual disponível.

### 3. Polling com `refetchInterval`

**Decisão:** `useQuery` com `refetchInterval: 60_000` (1 minuto) para `GET /notifications`.  
**Rationale:** Volume baixo de notificações; 1 minuto de latência é aceitável. Evita complexidade de WebSocket. O intervalo pode ser ajustado sem mudança de arquitetura.  
**Alternativa descartada:** Invalidação manual — exigiria trigger externo que não existe.

### 4. Estrutura de feature

**Decisão:** Seguir o padrão `api/types.ts` → `api/service.ts` → `api/queries.ts` dentro de `src/features/notifications/`, igual a outras features do projeto.  
**Rationale:** Consistência com o padrão estabelecido em `user-access`, `activities`, etc.

### 5. Formulário da página admin: `useAppForm` + Sheet/Dialog

**Decisão:** Formulário de envio de notificações em `Dialog` inline na página (não em rota separada), usando `useAppForm` com campos `title` (obrigatório), `description` (opcional), `target.sector` (select opcional), `target.role` (select opcional).  
**Rationale:** Formulário simples com 4 campos não justifica página separada. Padrão consistente com modal de edição de usuário.

### 6. Badge: contagem do array retornado por `GET /notifications`

**Decisão:** O badge exibe `notifications.length` (total de itens no array). Como a API já filtra soft-deleted, todos os itens retornados são "pendentes" para o usuário.  
**Rationale:** A API não tem campo `read_at`; a única ação do usuário é deletar. Contagem total é o indicador correto.

## Risks / Trade-offs

- **Polling em muitas abas** → múltiplas instâncias do React Query fazem polling independente. Mitigação: `refetchInterval` do React Query é pausado quando a aba está em background (`refetchIntervalInBackground: false` — padrão já correto).
- **Badge desatualizado após delete** → ao deletar uma notificação, invalidar `notificationKeys.all()` garante recontagem imediata.
- **Sheet no mobile com sidebar colapsada** → o `Sheet` abre por cima, sem conflito com o sidebar colapsado. Testar em viewport 375px.
