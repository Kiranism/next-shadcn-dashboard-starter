## MODIFIED Requirements

### Requirement: Visualizar candidatos no funil de seleção
O sistema SHALL exibir na aba "Candidatos" todos os candidatos (gerados por candidaturas aprovadas), com filtros por processo e por etapa atual. Para usuários com rank ≥ 3, cada card de candidato ativo SHALL exibir um indicador visual de status de agendamento de entrevista, derivado do cruzamento entre o e-mail do candidato e os slots com `booking_id !== null` retornados por `GET /selection-process/interviews/slots`.

#### Scenario: Listagem sem filtro
- **WHEN** o usuário acessa a aba "Candidatos" sem selecionar filtro
- **THEN** todos os candidatos de todos os processos são exibidos via `GET /selection-process/candidates`

#### Scenario: Filtro por processo ativo
- **WHEN** o usuário seleciona um processo no filtro
- **THEN** apenas candidatos daquele processo são exibidos; o filtro de etapa é habilitado com as etapas daquele processo

#### Scenario: Filtro por etapa
- **WHEN** o usuário seleciona processo e etapa
- **THEN** apenas candidatos naquela etapa são exibidos via `GET /selection-process/candidates?selection_process_id=uuid&stage_id=uuid`

#### Scenario: Nenhum candidato
- **WHEN** não há candidatos para o filtro selecionado
- **THEN** é exibido estado vazio com mensagem adequada

#### Scenario: Admin vê badge de entrevista marcada
- **WHEN** usuário com rank ≥ 3 acessa a aba e o candidato ativo tem e-mail correspondente a um slot com `booking_id !== null`
- **THEN** o card exibe badge verde "Entrevista marcada"

#### Scenario: Admin vê candidato sem entrevista marcada
- **WHEN** usuário com rank ≥ 3 acessa a aba e o candidato ativo não tem e-mail em nenhum slot com `booking_id !== null`
- **THEN** o card exibe badge neutro "Sem entrevista" ou ausência de badge colorido
