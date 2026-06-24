## ADDED Requirements

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

---

### Requirement: Avançar ou reprovar candidato
O sistema SHALL permitir que assessores e presidentes (rank ≥ 3) aprovem (avança para próxima etapa ou aprova final) ou reprovem (eliminam) candidatos ativos.

#### Scenario: Candidato ativo — ações disponíveis
- **WHEN** usuário com rank ≥ 3 visualiza um candidato com status `active`
- **THEN** botões "Avançar" (verde) e "Eliminar" (vermelho) são exibidos no card

#### Scenario: Aprovação com próxima etapa
- **WHEN** assessor clica "Avançar" em candidato que não está na última etapa
- **THEN** `PATCH /selection-process/candidates/:id` com `{ status: "approved" }` é chamado; `current_stage_id` avança e lista é atualizada

#### Scenario: Aprovação na última etapa
- **WHEN** assessor clica "Avançar" em candidato na última etapa
- **THEN** `PATCH` é chamado; candidato passa para status `approved` e sai do funil ativo

#### Scenario: Reprovação
- **WHEN** assessor clica "Eliminar"
- **THEN** `PATCH` com `{ status: "reproved" }` é chamado; candidato passa para status `eliminated`

#### Scenario: Candidato finalizado
- **WHEN** candidato tem status `approved` ou `eliminated`
- **THEN** os botões de ação NÃO são exibidos; apenas o badge de status é mostrado

---

### Requirement: Detalhes do candidato em sheet lateral
O sistema SHALL exibir ao clicar no card de um candidato uma sheet com todos os seus dados e histórico de etapa atual.

#### Scenario: Sheet com dados do candidato
- **WHEN** usuário clica em um card de candidato
- **THEN** sheet lateral abre com nome, curso, período, e-mail, telefone, tamanho de camiseta, etapa atual e status

---

### Requirement: Páginas públicas PSEL com viewport mobile correto
As páginas `/psel/inscricao` e `/psel/entrevistas/[token]` SHALL ter viewport meta correto para garantir renderização adequada em dispositivos móveis, sem zoom automático em campos de input e sem overflow horizontal.

#### Scenario: Acesso via Safari mobile (iOS)
- **WHEN** um candidato acessa `/psel/inscricao` em um iPhone com Safari
- **THEN** a página SHALL renderizar sem overflow horizontal e os campos de formulário SHALL ter font-size mínimo de 16px para evitar zoom automático do iOS

#### Scenario: Acesso via Chrome Android
- **WHEN** um candidato acessa `/psel/entrevistas/[token]` em Android com Chrome
- **THEN** a página SHALL ser responsiva, com botões e campos acessíveis por toque (min 44px de altura)

#### Scenario: Formulário de inscrição em tela pequena
- **WHEN** a largura da viewport é menor que 480px
- **THEN** o layout do formulário de inscrição SHALL empilhar os campos verticalmente sem overflow e sem elementos cortados

---

### Requirement: Entrevista PSEL acessível sem autenticação em qualquer browser
A página `/psel/entrevistas/[token]` SHALL funcionar em browsers modernos sem dependências de APIs não disponíveis (push, serviceWorker) e sem exigir autenticação do candidato.

#### Scenario: Acesso via token válido em Safari 15+
- **WHEN** um candidato acessa o link de entrevista com token válido em Safari 15
- **THEN** a página SHALL carregar corretamente, exibir as informações da entrevista e permitir as ações disponíveis sem erro

#### Scenario: Componentes da entrevista sem erros de hidratação
- **WHEN** a página de entrevista é renderizada pelo servidor e hidratada no cliente
- **THEN** nenhum erro de hidratação React SHALL ocorrer no console do browser
