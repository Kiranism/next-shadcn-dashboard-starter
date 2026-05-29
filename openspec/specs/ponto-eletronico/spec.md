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
