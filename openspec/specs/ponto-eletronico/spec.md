## Requirements

### Requirement: Exibição de datas no padrão brasileiro
Todas as datas exibidas na página `/dashboard/ponto` SHALL usar o formato brasileiro `dd/mm/aaaa`. Strings de data no formato ISO (YYYY-MM-DD) provenientes da API SHALL ser convertidas com `toLocaleDateString('pt-BR')` antes de renderizar. O intervalo semanal (`week_start — week_end`) no `WeeklySummaryCard` SHALL exibir as datas formatadas em pt-BR.

#### Scenario: Exibição do intervalo semanal
- **WHEN** o `WeeklySummaryCard` recebe `week_start` e `week_end` da API (ex: "2024-01-15", "2024-01-21")
- **THEN** o componente SHALL exibir no formato "15/01/2024 — 21/01/2024"

#### Scenario: Datas de sessões na lista semanal
- **WHEN** sessões da semana são listadas no card do usuário
- **THEN** o dia da semana e data SHALL ser formatados em pt-BR (ex: "seg, 15/01")

### Requirement: Layout responsivo para usuário comum
Para usuários com `rank < 3`, o layout da página `/dashboard/ponto` SHALL exibir apenas o `WeeklySummaryCard` centralizado horizontalmente com `max-w-lg`, ocupando largura total em mobile.

#### Scenario: Visualização do usuário comum em tela grande
- **WHEN** um usuário com rank < 3 acessa `/dashboard/ponto` em viewport >= 1024px
- **THEN** o `WeeklySummaryCard` SHALL ter largura máxima de `max-w-lg` e estar centralizado horizontalmente

#### Scenario: Visualização do usuário comum em mobile
- **WHEN** um usuário com rank < 3 acessa `/dashboard/ponto` em viewport < 640px
- **THEN** o `WeeklySummaryCard` SHALL ocupar largura total da tela

### Requirement: Layout responsivo para superusuário
Para usuários com `rank >= 3`, o layout da página `/dashboard/ponto` SHALL exibir `WeeklySummaryCard` e `SettingsCard` lado a lado em telas >= 1024px, e empilhados em telas menores. A tabela de equipe SHALL ocupar largura total abaixo dos cards.

#### Scenario: Visualização do superusuário em tela grande
- **WHEN** um superusuário acessa `/dashboard/ponto` em viewport >= 1024px
- **THEN** `WeeklySummaryCard` e `SettingsCard` SHALL aparecer em grid de 2 colunas, e a tabela SHALL ocupar a linha abaixo em largura total

#### Scenario: Visualização do superusuário em mobile
- **WHEN** um superusuário acessa `/dashboard/ponto` em viewport < 1024px
- **THEN** `WeeklySummaryCard`, `SettingsCard` e a tabela SHALL aparecer empilhados verticalmente

### Requirement: SettingsCard exibe e edita min_availability_hours
O `SettingsCard` SHALL exibir e permitir a edição de `min_availability_hours` (inteiro entre 0 e 98, onde 0 = desabilitado) para superusuários. A configuração SHALL ser exibida como um item separado dentro do mesmo card, com label "Disponibilidade Mínima" e descrição "Mínimo de horas de disponibilidade semanal que cada membro deve configurar em sua rotina. 0 = desabilitado.". A edição SHALL ser restrita a superusuários (rank >= 3).

#### Scenario: Exibição do valor atual
- **WHEN** o `SettingsCard` é carregado para um superusuário
- **THEN** SHALL exibir o valor atual de `min_availability_hours` com sufixo "horas / semana" ou "desabilitado" quando o valor é 0

#### Scenario: Edição inline do valor
- **WHEN** o superusuário clica em "Editar" para `min_availability_hours`
- **THEN** SHALL aparecer um input numérico (min=0, max=98) para edição; ao confirmar, SHALL chamar `PATCH /settings` com `{ min_availability_hours: valor }` e exibir toast de sucesso

#### Scenario: Valor 0 indica desabilitado
- **WHEN** `min_availability_hours` é 0
- **THEN** o `SettingsCard` SHALL exibir "Desabilitado" no lugar do valor numérico

### Requirement: SettingsCard exibe descrições contextuais para todas as configurações
Cada configuração no `SettingsCard` SHALL exibir uma descrição curta abaixo do seu título, visível a todos os usuários, que explique o que a configuração controla.

#### Scenario: Descrição de min_week_hours
- **WHEN** qualquer usuário visualiza o `SettingsCard`
- **THEN** a configuração `min_week_hours` SHALL exibir a descrição "Mínimo de horas semanais para o status 'Cumpriu' no registro de ponto."

#### Scenario: Descrição de min_availability_hours
- **WHEN** qualquer usuário visualiza o `SettingsCard`
- **THEN** a configuração `min_availability_hours` SHALL exibir a descrição "Mínimo de horas de disponibilidade semanal exigido na rotina de cada membro. 0 = desabilitado."
