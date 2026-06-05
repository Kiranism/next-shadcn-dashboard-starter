## ADDED Requirements

### Requirement: Exibir leaderboard das casas com ciclo ativo
A página `/dashboard/gamification` SHALL exibir uma aba "Ranking" visível a todos os usuários autenticados, mostrando as 3 casas (Lumina, Voltus, Nexus) com a pontuação total do ciclo ativo, ordenadas por pontuação decrescente. O 1º lugar DEVE ter destaque visual diferenciado (ex: borda dourada).

#### Scenario: Carregamento do ranking com ciclo ativo
- **WHEN** o usuário acessa a aba "Ranking"
- **THEN** o sistema exibe 3 cards de casa com nome, pontuação total e indicação de posição (1º, 2º, 3º lugar)

#### Scenario: Sem ciclo ativo
- **WHEN** não existe nenhum ciclo ativo na API
- **THEN** o sistema exibe um empty state informando que nenhum ciclo está ativo no momento

### Requirement: Exibir pódio de membros por casa
Cada card de casa SHALL exibir o top 3 membros com mais pontos contribuídos naquele ciclo, com nome e pontuação individual.

#### Scenario: Pódio disponível
- **WHEN** existem membros com submissões aprovadas na casa
- **THEN** o card exibe até 3 membros com nome e pontos contribuídos, ordenados por pontuação decrescente

#### Scenario: Casa sem membros com pontos
- **WHEN** nenhum membro da casa possui submissões aprovadas
- **THEN** o card exibe mensagem indicando que nenhuma pontuação foi registrada ainda

### Requirement: Layout responsivo do ranking
O layout dos cards de casa SHALL ser uma grade de 3 colunas em desktop e uma coluna única em mobile (breakpoint md do Tailwind).

#### Scenario: Visualização em desktop
- **WHEN** a largura da tela é ≥ 768px
- **THEN** os 3 cards de casa são exibidos lado a lado em uma grade de 3 colunas

#### Scenario: Visualização em mobile
- **WHEN** a largura da tela é < 768px
- **THEN** os cards de casa são empilhados verticalmente em coluna única
