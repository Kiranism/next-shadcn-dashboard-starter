## MODIFIED Requirements

### Requirement: Atualizar status de candidatura
O sistema SHALL permitir que assessores e presidentes atualizem o status de uma candidatura enviando `approved` ou `reproved` (não `rejected`) para a API.

#### Scenario: Assessor reprova candidatura
- **WHEN** usuário com rank ≥ 3 clica em "Reprovar" para uma candidatura
- **THEN** `PATCH /selection-process/applications/:applicationId` é chamado com `{ status: "reproved" }` (não `rejected`) e a lista é atualizada

#### Scenario: Badge exibe status correto para reproved
- **WHEN** uma candidatura ou candidato tem status `reproved`
- **THEN** o badge exibe "Reprovado" com estilo vermelho, sem erro de tipo
