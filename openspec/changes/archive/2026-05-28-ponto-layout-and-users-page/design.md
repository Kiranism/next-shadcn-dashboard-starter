## Context

O projeto possui uma página `/dashboard/ponto` já funcional com `WeeklySummaryCard`, `SettingsCard` e `UsersSuperuserTable`. O `WeeklySummaryCard` exibe `week_start` e `week_end` como strings ISO brutas (ex: `2024-01-15`). O `PontoEletronicoView` usa um grid condicional mas sem `max-width` adequado para o usuário comum, tornando o card excessivamente largo em telas grandes.

A rota `/dashboard/users` está configurada na navegação (`nav-config.ts`) com `minRank: 3`, mas a página e o feature module correspondentes não existem. O sistema já tem a query `/users` em `ponto-eletronico/api/queries.ts` e o tipo `UserResponse` em `ponto-eletronico/api/types.ts`, mas esses pertencem logicamente ao feature de ponto e devem ser reaproveitados (não duplicados).

## Goals / Non-Goals

**Goals:**
- Formatar todas as datas em `/dashboard/ponto` com `toLocaleDateString('pt-BR')` (dd/mm/aaaa).
- Ajustar o layout de `PontoEletronicoView` para centrar/limitar o card do usuário comum e otimizar o grid do superusuário.
- Criar a página `/dashboard/users` com tabela de usuários e modal de edição de setor, cargo e informações.
- Manter o guarda `rank >= 3` na rota de usuários, redirecionando ou ocultando o conteúdo para usuários sem permissão.

**Non-Goals:**
- Criar/deletar usuários (apenas editar informações).
- Implementar paginação server-side na tabela de usuários.
- Alterar a API backend (apenas consumir endpoints existentes).
- Migrar a query `/users` para fora do feature de ponto (reaproveitamento via importação direta).

## Decisions

### D1 — Formatação de datas com helper utilitário local

**Decisão**: Criar uma função `formatDateBR(dateStr: string)` no componente ou em um arquivo de util compartilhado que usa `new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })`.

**Rationale**: O sufixo `T00:00:00` evita problemas de fuso horário ao parsear strings de data sem horário (o JavaScript trata strings ISO sem horário como UTC). Alternativas como `date-fns` seriam uma dependência extra desnecessária para uma transformação simples.

### D2 — Layout de `PontoEletronicoView` com `max-w-lg` para usuário comum

**Decisão**: Para o usuário comum, envolver `WeeklySummaryCard` em um container com `max-w-lg mx-auto` (ou similar). Para superusuário, manter grid de 2 colunas no topo (`grid-cols-1 lg:grid-cols-2`) com ambos os cards crescendo para preencher o espaço, e tabela em largura total abaixo.

**Rationale**: `max-w-md` (28rem) era muito estreito para o conteúdo do card. `max-w-lg` (32rem) oferece melhor equilíbrio. O grid `lg:grid-cols-2` (ao invés de `sm:`) garante que os dois cards superusuário só fiquem lado a lado em telas maiores, evitando compressão em tablets.

### D3 — Feature module `/features/users/` com reaproveitamento de tipos do ponto

**Decisão**: Criar `src/features/users/` com sua própria `api/types.ts`, `api/service.ts`, `api/queries.ts`, e componentes `users-view.tsx` e `edit-user-modal.tsx`. Importar `UserResponse` de `@/features/ponto-eletronico/api/types` no service de usuários (sem duplicar o tipo).

**Alternativa descartada**: Mover `usersQueryOptions` para um módulo compartilhado. Descartada por aumentar complexidade e refatoração fora do escopo.

### D4 — Modal de edição com Dialog do shadcn/ui e formulário TanStack

**Decisão**: Usar `<Dialog>` do shadcn/ui com `useAppForm` + `useFormFields` para editar `name`, `role`, `sector` e `cpf` do usuário. A mutação chama `PATCH /users/:id`.

**Rationale**: Segue as convenções do projeto (docs/forms.md). O modal evita navegação para outra tela e mantém o contexto da tabela.

### D5 — Proteção de rota no server component

**Decisão**: Verificar o rank do usuário no server component da página `/dashboard/users/page.tsx` e redirecionar para `/dashboard/ponto` se `rank < 3`. O layout do dashboard já oculta o link na nav para usuários com rank insuficiente.

## Risks / Trade-offs

- **[Risco] PATCH /users/:id pode não existir no backend** → Mitigação: Verificar com o backend antes de implementar; se não existir, o modal pode ser implementado sem a chamada de save (read-only) até o endpoint estar disponível.
- **[Risco] Fuso horário em formatação de datas** → Mitigação: Sempre usar `+ 'T00:00:00'` ao parsear strings de data sem horário para tratar como horário local.
- **[Trade-off] Reaproveitamento vs. encapsulamento** → Importar `UserResponse` do feature de ponto cria acoplamento entre features. Aceitável porque os tipos refletem o contrato da API, que é compartilhado.
