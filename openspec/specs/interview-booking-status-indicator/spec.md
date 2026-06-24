## ADDED Requirements

### Requirement: Indicar status de agendamento de entrevista por candidato
O sistema SHALL exibir, no card de cada candidato na aba `Candidatos`, um badge ou indicador visual que distingue se o candidato já agendou uma entrevista (`com entrevista`) ou ainda não agendou (`sem entrevista`). Esse indicador SHALL ser visível apenas para usuários com rank ≥ 3 (admins), pois apenas eles têm acesso aos dados de slots da equipe.

#### Scenario: Admin visualiza candidato com entrevista marcada
- **WHEN** um admin acessa a aba Candidatos e um candidato com `status === 'active'` tem `email` que consta em algum `MyInterviewSlot` com `booking_id !== null`
- **THEN** o card desse candidato SHALL exibir um badge verde com texto "Entrevista marcada" ou ícone equivalente

#### Scenario: Admin visualiza candidato sem entrevista marcada
- **WHEN** um admin acessa a aba Candidatos e um candidato com `status === 'active'` não tem `email` em nenhum `MyInterviewSlot` com `booking_id !== null`
- **THEN** o card desse candidato SHALL exibir um badge muted/neutro com texto "Sem entrevista" ou ausência de badge colorido

#### Scenario: Usuário sem rank admin não vê o indicador
- **WHEN** um consultor com rank < 3 acessa a aba Candidatos
- **THEN** nenhum badge de status de entrevista SHALL ser exibido nos cards

#### Scenario: Slots ainda não carregados
- **WHEN** os dados de slots estão sendo carregados (`isLoading === true`)
- **THEN** os cards de candidatos SHALL ser exibidos normalmente sem o indicador (sem skeleton extra por candidato), para evitar layout shift

#### Scenario: Candidato eliminado ou aprovado
- **WHEN** o candidato tem `status !== 'active'`
- **THEN** o badge de entrevista SHALL NOT ser exibido (candidatos finalizados não precisam do indicador)
