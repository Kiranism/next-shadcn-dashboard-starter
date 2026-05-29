## Why

A página `/dashboard/ponto` exibe datas em formato ISO (ex: "2024-01-15") em vez do padrão brasileiro (dd/mm/yyyy), e o layout dos cards não aproveita bem o espaço em diferentes contextos (usuário comum vs superusuário). Além disso, o sistema já possui a rota `/dashboard/users` configurada na navegação mas a página ainda não existe, deixando superusuários sem uma área dedicada para gerenciar informações dos colaboradores.

## What Changes

- **Formatação de datas no `/dashboard/ponto`**: Converter todas as exibições de datas para o padrão brasileiro (`toLocaleDateString('pt-BR')`), especialmente o intervalo `week_start — week_end` no `WeeklySummaryCard` que atualmente mostra o string ISO bruto.
- **Layout melhorado no `/dashboard/ponto`**:
  - Usuário comum: card do relógio eletrônico centralizado com largura máxima adequada para leitura confortável.
  - Superusuário: layout em grid com card do relógio + card de configurações lado a lado no topo, e tabela de equipe abaixo ocupando largura total.
- **Nova página `/dashboard/users`**: Página exclusiva para superusuários (rank ≥ 3) com tabela de todos os usuários cadastrados, exibindo nome, email, CPF, cargo e setor, com modal de edição para alterar setor, cargo e demais informações de cada usuário.

## Capabilities

### New Capabilities
- `users-management`: Página de gerenciamento de usuários para superusuários — lista todos os usuários com dados pessoais (nome, email, CPF, cargo, setor) e permite editar setor, cargo e outras informações via modal.

### Modified Capabilities
- `ponto-eletronico`: Correção de exibição de datas (formato ISO → pt-BR) e melhoria do layout responsivo dos cards para usuários comuns e superusuários.

## Impact

- `src/features/ponto-eletronico/components/weekly-summary-card.tsx` — formatar `week_start`/`week_end` com `toLocaleDateString('pt-BR')`
- `src/features/ponto-eletronico/components/ponto-eletronico-view.tsx` — ajustar classes de grid e max-width para cada perfil
- `src/app/dashboard/users/page.tsx` — nova página (rota já existente na nav)
- `src/features/users/` — novo feature module com `api/types.ts`, `api/service.ts`, `api/queries.ts`, e componentes `users-view.tsx`, `edit-user-modal.tsx`
- Reuso da query `/users` já existente em `ponto-eletronico/api/queries.ts` (mover ou duplicar conforme necessário)
