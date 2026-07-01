## ADDED Requirements

### Requirement: Distinguir slots livres de slots reservados no heatmap de equipe
O `TeamAvailabilityHeatmap` SHALL usar cores distintas por célula para indicar o estado de ocupação dos slots naquele dia-hora, permitindo que superusers identifiquem imediatamente a disponibilidade real da equipe de entrevistadores.

#### Scenario: Célula com apenas slots livres
- **WHEN** todos os slots naquela célula (dia × hora) têm `booking_id === null`
- **THEN** a célula SHALL ser exibida em azul (cor primary do tema) com contagem de consultores disponíveis

#### Scenario: Célula com slots mistos (livres e reservados)
- **WHEN** a célula contém slots com `booking_id === null` E slots com `booking_id !== null`
- **THEN** a célula SHALL ser exibida em âmbar/amarelo (`bg-amber-500`) indicando ocupação parcial, exibindo a proporção `livres/total` ou contagem separada

#### Scenario: Célula com apenas slots reservados
- **WHEN** todos os slots naquela célula têm `booking_id !== null`
- **THEN** a célula SHALL ser exibida em esmeralda/verde (`bg-emerald-600`) indicando total ocupação

#### Scenario: Célula vazia
- **WHEN** não há slots naquela célula
- **THEN** a célula SHALL ser exibida em cinza muted (sem contagem), sem interatividade

#### Scenario: Legenda do heatmap
- **WHEN** o heatmap está visível
- **THEN** SHALL existir uma legenda com os três estados: "Disponível" (azul), "Parcialmente ocupado" (âmbar), "Totalmente reservado" (esmeralda)

### Requirement: Dialog de detalhe por célula com grupos de status
Ao clicar em uma célula do heatmap, o dialog SHALL exibir os consultores agrupados por status: primeiro os que têm entrevista marcada naquele horário, depois os disponíveis.

#### Scenario: Dialog com consultores em grupos
- **WHEN** o usuário clica em uma célula com slots mistos ou reservados
- **THEN** o dialog SHALL exibir dois grupos: "Com entrevista marcada" listando os consultores com `booking_id !== null` e o nome do candidato quando disponível (`candidate_name`), e "Disponíveis" listando os consultores com `booking_id === null`

#### Scenario: Dialog com todos livres
- **WHEN** o usuário clica em uma célula onde todos os slots têm `booking_id === null`
- **THEN** o dialog SHALL listar todos os consultores disponíveis sem grupo separado de "Com entrevista marcada"

#### Scenario: Dialog com todos reservados
- **WHEN** o usuário clica em uma célula onde todos os slots têm `booking_id !== null`
- **THEN** o dialog SHALL listar todos os consultores com o nome do candidato associado (quando disponível)

#### Scenario: Responsividade mobile do heatmap
- **WHEN** o usuário acessa em dispositivo com largura < 480px
- **THEN** o heatmap SHALL ser horizontalmente scrollável sem overflow do layout pai, com labels de hora legíveis e células com min-width adequado para toque (≥ 36px)
