## ADDED Requirements

### Requirement: Exibir co-entrevistador (dupla) em slots agendados
O sistema SHALL exibir, no `SlotItem` de um slot agendado (`booking_id !== null`) na view pessoal do consultor, o nome do co-entrevistador (outro consultor que também tem um slot com o mesmo `booking_id`). Essa informação SHALL ser derivada dos dados já disponíveis no hook `useMyInterviewSlots()` — que para admins retorna todos os slots da equipe — sem nova chamada de API.

#### Scenario: Admin com dupla detectada
- **WHEN** um admin acessa a view "Minha disponibilidade" e um slot pessoal agendado (`booking_id !== null`) tem outro slot com mesmo `booking_id` e `consultant_id` diferente presente nos dados retornados pela API
- **THEN** o `SlotItem` SHALL exibir o nome do co-entrevistador abaixo ou ao lado do nome do candidato, com label "Dupla:" ou ícone de usuário adicional

#### Scenario: Admin sem dupla detectada
- **WHEN** não existe outro slot com o mesmo `booking_id` nos dados retornados
- **THEN** nenhuma informação de dupla SHALL ser exibida (ausência silenciosa, sem mensagem de erro)

#### Scenario: Slot livre (sem booking)
- **WHEN** um slot tem `booking_id === null`
- **THEN** nenhuma informação de dupla SHALL ser exibida

#### Scenario: Consultor com rank < 3
- **WHEN** um usuário com rank < 3 acessa a view de entrevistas (recebe apenas seus próprios slots da API)
- **THEN** a seção de dupla SHALL NOT ser exibida (dados insuficientes para derivação)

#### Scenario: Dois ou mais co-entrevistadores
- **WHEN** existem dois ou mais outros consultores com slots no mesmo `booking_id`
- **THEN** todos os nomes SHALL ser exibidos, separados por vírgula ou em lista
