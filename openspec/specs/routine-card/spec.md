## Requirements

### Requirement: Exibição do RoutineCard na página Individual
A página `/dashboard/individual` SHALL exibir o `RoutineCard` abaixo da `ActivitiesSection` existente, em largura total, para todos os usuários autenticados.

#### Scenario: Carregamento inicial da rotina configurada
- **WHEN** o usuário acessa `/dashboard/individual` e já possui rotina salva
- **THEN** o `RoutineCard` SHALL carregar os slots da API (`GET /routine`) e pré-marcar as células correspondentes como disponíveis

#### Scenario: Primeiro acesso sem rotina configurada
- **WHEN** o usuário acessa `/dashboard/individual` e a API retorna `{ "slots": null }`
- **THEN** o `RoutineCard` SHALL exibir todos os 98 slots como indisponíveis (false)

### Requirement: Grid interativo desktop (7 dias × 14 slots)
Em viewports `>= 768px` o `RoutineCard` SHALL exibir uma grade com linhas representando os dias da semana (Segunda a Domingo) e colunas representando os slots horários de 08h–09h até 21h–22h (14 colunas). Células verdes indicam disponibilidade; vermelhas escuras indicam indisponibilidade.

#### Scenario: Toggle de célula individual por clique
- **WHEN** o usuário clica em uma célula do grid
- **THEN** o estado daquela célula SHALL alternar entre disponível e indisponível sem salvar na API

#### Scenario: Seleção por click-and-drag
- **WHEN** o usuário pressiona o mouse em uma célula e arrasta sobre células adjacentes
- **THEN** todas as células percorridas SHALL assumir o mesmo estado da célula inicial (se estava false, todas ficam true; se estava true, todas ficam false)

#### Scenario: Drag encerra ao soltar o mouse fora do grid
- **WHEN** o usuário inicia um drag e solta o mouse fora da área do grid
- **THEN** o drag SHALL ser encerrado e o estado das células arrastadas SHALL ser mantido

### Requirement: Layout accordion para mobile (< 768px)
Em viewports `< 768px` o `RoutineCard` SHALL exibir os dias da semana como itens de accordion (collapsible). Cada item SHALL mostrar no header o nome do dia, um badge com quantidade de horas disponíveis e uma strip horizontal com mini-células coloridas. Ao expandir, SHALL exibir a linha completa de 14 células togglables em uma grade de 7 colunas.

#### Scenario: Strip visual no header do accordion
- **WHEN** o accordion está recolhido
- **THEN** o header SHALL mostrar uma strip de 14 mini-células coloridas representando o estado atual dos slots

#### Scenario: Expansão do accordion exibe células clicáveis
- **WHEN** o usuário expande um dia no accordion
- **THEN** SHALL aparecer uma grade responsiva com as 14 células horárias daquele dia, cada uma togglable por toque

### Requirement: Barra de progresso de disponibilidade
O `RoutineCard` SHALL exibir uma barra de progresso indicando a quantidade de horas configuradas como disponíveis em relação ao mínimo exigido (`min_availability_hours` das settings). A barra SHALL ser verde quando o mínimo for atingido e amarela/laranja quando abaixo.

#### Scenario: Progresso abaixo do mínimo
- **WHEN** o total de slots disponíveis convertido em horas é menor que `min_availability_hours`
- **THEN** a barra SHALL mostrar o progresso parcial e o badge SHALL exibir "Xh / Yh mínimo" em destaque de alerta

#### Scenario: Progresso atingido ou acima do mínimo
- **WHEN** o total de slots disponíveis é maior ou igual ao mínimo
- **THEN** a barra SHALL ser preenchida completamente e o badge SHALL exibir "Xh / Yh mínimo" com cor de sucesso

#### Scenario: Mínimo desabilitado (min_availability_hours = 0)
- **WHEN** `min_availability_hours` é 0
- **THEN** o `RoutineCard` SHALL ocultar a barra de progresso e o badge de progresso

### Requirement: Salvar rotina na API
O `RoutineCard` SHALL exibir um botão "Salvar horário" que submete o estado local dos slots via `PUT /routine`. O botão SHALL ser desabilitado enquanto a mutation estiver pendente.

#### Scenario: Salvamento com sucesso
- **WHEN** o usuário clica "Salvar horário" e a API retorna 200
- **THEN** SHALL aparecer um toast de sucesso e o cache React Query da rotina SHALL ser invalidado

#### Scenario: Salvamento com erro de disponibilidade insuficiente (400)
- **WHEN** a API retorna 400 por `min_availability_hours` não atingido
- **THEN** SHALL aparecer um toast de erro com a mensagem descritiva retornada pela API

### Requirement: Legenda e hint de interação
O `RoutineCard` SHALL exibir uma legenda com os indicadores visual "Disponível" (verde) e "Indisponível" (vermelho). Em desktop SHALL mostrar a dica "Clique e arraste para selecionar" alinhada à direita do header.

#### Scenario: Renderização da legenda
- **WHEN** o `RoutineCard` é renderizado
- **THEN** SHALL exibir dois itens de legenda — um quadrado verde com label "Disponível" e um quadrado vermelho escuro com label "Indisponível"
