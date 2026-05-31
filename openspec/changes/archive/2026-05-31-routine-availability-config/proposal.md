## Why

Os usuários precisam de um lugar para configurar sua disponibilidade semanal, dado que a API já suporta `PUT /routine` e `GET /routine`. A página `/dashboard/ponto` expõe configurações de superusuário incompletas — o campo `min_availability_hours` existe na API mas ainda não está acessível na UI, e nenhuma das configurações possui descrição explicativa.

## What Changes

- **Nova feature `routine`**: `RoutineCard` adicionado à página `/dashboard/individual` — grid interativo de 7 dias × 14 slots horários (08h–22h), com suporte a click-and-drag, barra de progresso e layout responsivo (accordion no mobile).
- **Settings expandido**: `SettingsCard` na página `/dashboard/ponto` exibe e permite editar `min_availability_hours` além do `min_week_hours` já existente; ambos ganham descrições contextuais visíveis a todos, edição restrita a superusuário.
- **Tipo `AppSettings` atualizado**: adiciona campo `min_availability_hours: number` ao tipo existente em `src/types/api.ts`.
- **Novo `RoutineRepository`**: encapsula `GET /routine`, `PUT /routine` com React Query, exportado via `src/repositories/index.ts`.

## Capabilities

### New Capabilities

- `routine-card`: Card interativo na página Individual para o usuário visualizar e salvar sua rotina semanal de disponibilidade. Desktop: grid com linhas = dias e colunas = slots de hora. Mobile: accordion por dia com strip visual de cores. Suporte a click e drag para seleção em massa. Barra de progresso mostrando horas configuradas vs mínimo exigido.

### Modified Capabilities

- `ponto-eletronico`: `SettingsCard` passa a exibir e editar `min_availability_hours` (0–98) além de `min_week_hours`. Cada configuração ganha uma descrição curta visível abaixo do título para evitar confusão sobre o que cada campo controla.

## Impact

- `src/types/api.ts` — adiciona `min_availability_hours` a `AppSettings`
- `src/repositories/routine.repository.ts` — arquivo novo
- `src/repositories/index.ts` — exporta `RoutineRepository`
- `src/features/routine/` — feature nova com `RoutineCard` e sub-componentes
- `src/app/dashboard/individual/page.tsx` — renderiza `RoutineCard` abaixo de `ActivitiesSection`
- `src/features/ponto-eletronico/components/settings-card.tsx` — expande para duas configurações com descrições
