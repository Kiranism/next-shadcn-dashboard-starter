## ADDED Requirements

### Requirement: Visualizar lista de processos seletivos
O sistema SHALL exibir todos os processos seletivos na aba "Processos" da página `/psel`, ordenados por `starts_at` decrescente, mostrando título, datas de início e fim, e status (ativo, encerrado, futuro).

#### Scenario: Usuário autenticado acessa a aba Processos
- **WHEN** o usuário navega para `/psel`
- **THEN** a aba "Processos" é exibida como default e lista todos os processos retornados por `GET /selection-process`

#### Scenario: Nenhum processo cadastrado
- **WHEN** `GET /selection-process` retorna array vazio
- **THEN** é exibido um estado vazio com mensagem adequada

---

### Requirement: Criar processo seletivo
O sistema SHALL permitir que assessores e presidentes (rank ≥ 3) criem novos processos seletivos via dialog/sheet com validação de datas.

#### Scenario: Assessor abre dialog de criação
- **WHEN** usuário com rank ≥ 3 clica em "Novo processo"
- **THEN** um dialog é aberto com campos title, starts_at e ends_at

#### Scenario: Criação bem-sucedida
- **WHEN** o formulário é submetido com dados válidos
- **THEN** `POST /selection-process` é chamado e a lista é atualizada

#### Scenario: Sobreposição de datas
- **WHEN** a API retorna 409
- **THEN** o erro é exibido com mensagem "O período informado conflita com outro processo seletivo existente"

#### Scenario: Usuário sem permissão
- **WHEN** usuário com rank < 3 acessa a aba Processos
- **THEN** o botão "Novo processo" NÃO é exibido

---

### Requirement: Editar processo seletivo
O sistema SHALL permitir que assessores e presidentes editem título e datas de um processo existente.

#### Scenario: Edição bem-sucedida
- **WHEN** assessor clica em editar e submete o formulário com dados válidos
- **THEN** `PATCH /selection-process/:processId` é chamado e a lista é atualizada

#### Scenario: Tentativa de edição com datas inválidas
- **WHEN** `ends_at` é anterior ou igual a `starts_at`
- **THEN** o formulário exibe erro de validação antes de submeter

---

### Requirement: Visualizar candidaturas
O sistema SHALL exibir na aba "Candidaturas" a lista de candidaturas de todos os processos, com filtro por processo seletivo.

#### Scenario: Usuário vê candidaturas do processo selecionado
- **WHEN** o usuário seleciona um processo no filtro
- **THEN** apenas candidaturas daquele processo são exibidas via `GET /selection-process/applications?selection_process_id=uuid`

#### Scenario: Sem candidaturas
- **WHEN** o processo selecionado não tem candidaturas
- **THEN** é exibido estado vazio com mensagem adequada

---

### Requirement: Atualizar status de candidatura
O sistema SHALL permitir que assessores e presidentes atualizem o status de uma candidatura (pending → approved | rejected | waitlisted).

#### Scenario: Assessor aprova candidatura
- **WHEN** usuário com rank ≥ 3 seleciona "Aprovado" para uma candidatura
- **THEN** `PATCH /selection-process/applications/:applicationId` é chamado com `{ status: "approved" }` e a lista é atualizada

#### Scenario: Usuário sem permissão vê candidaturas
- **WHEN** usuário com rank < 3 acessa a aba Candidaturas
- **THEN** os controles de atualização de status NÃO são exibidos (somente visualização)
