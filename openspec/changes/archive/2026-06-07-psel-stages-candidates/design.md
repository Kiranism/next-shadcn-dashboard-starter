## Context

A página `/psel` já tem três abas: Processos, Candidaturas e (após esta mudança) Candidatos. O repositório `SelectionProcessRepository` e os tipos em `src/types/selection-process.ts` precisam ser extendidos. A API usa `reproved` (não `rejected`) tanto no PATCH de applications quanto no PATCH de candidates — o badge atual mapeia `rejected` mas a API envia `reproved`.

Novos endpoints da API:
- `POST /selection-process/stages` — cria etapa em um processo
- `GET /selection-process/stages?selection_process_id=uuid` — lista etapas
- `GET /selection-process/candidates?selection_process_id=uuid&stage_id=uuid` — lista candidatos
- `PATCH /selection-process/candidates/:candidateId` — aprova (avança/finaliza) ou reprova candidato

## Goals / Non-Goals

**Goals:**
- Etapas visíveis inline na aba Processos, expandíveis por processo; criar etapa abre um dialog simples
- Aba Candidatos com grid de cards responsivo, filtros por processo e etapa, ações aprovar/reprovar para rank ≥ 3
- Badge de status corrigido para `reproved`
- Tudo mobile-first: cards empilhados em 1 coluna no mobile, grid no desktop

**Non-Goals:**
- Editar ou reordenar etapas (API não expõe PATCH de stages)
- Deletar etapas ou candidatos
- Arrastar candidatos entre etapas (kanban)

## Decisions

### D1 — Etapas inline na aba Processos, não em aba separada

Etapas pertencem a um processo, logo ficam melhor como seção expansível dentro do card do processo (`StagesSection`). Alternativa de aba própria fragmenta o contexto.

### D2 — Aba Candidatos independente das Candidaturas

Candidatos são entidades distintas (criadas a partir de candidaturas aprovadas); misturá-los na aba "Candidaturas" confundiria o usuário. Tab separada é mais claro.

### D3 — Filtro de etapa depende do filtro de processo

O endpoint de candidatos aceita `stage_id` mas etapas pertencem a um processo. Portanto o filtro de etapa só é habilitado depois de selecionar um processo, e é populado com as etapas daquele processo.

### D4 — `reproved` no tipo de status

A API usa `reproved` como valor no PATCH de applications e no PATCH de candidates. Os tipos existentes usam `rejected`. Vai ser necessário:
- Atualizar `SelectionProcessApplicationStatus` para incluir `reproved`
- Atualizar o badge para mapear `reproved` → "Reprovado"
- O PATCH de candidates usa payload `{ status: "approved" | "reproved" }`

### D5 — Card de candidato similar ao de candidatura

Reutiliza o mesmo padrão visual: grid 2×mobile / 3×tablet / 4×desktop, foto do candidato (não disponível no endpoint — omitir), nome, curso, etapa atual. Ação de avançar/reprovar via botões no card + sheet de detalhes.

## Risks / Trade-offs

- [Status `reproved` vs `rejected`] A troca de tipo pode quebrar candidaturas já aprovadas se o servidor retornar `reproved` para applications — monitorar após deploy
- [Foto ausente em candidatos] O endpoint `GET /selection-process/candidates` não retorna `photo_signed_url`; o card de candidato usa um avatar genérico
- [Etapas sem position display] A API retorna `position` — usar para ordenar e exibir como "Etapa 1", "Etapa 2"

## Migration Plan

1. Atualizar tipos em `src/types/selection-process.ts`
2. Adicionar hooks no repository
3. Criar componentes de etapas
4. Criar componentes de candidatos
5. Atualizar `psel-view.tsx` e corrigir o badge
