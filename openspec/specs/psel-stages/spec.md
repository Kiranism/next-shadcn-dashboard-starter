## ADDED Requirements

### Requirement: Visualizar etapas de um processo seletivo
O sistema SHALL exibir as etapas de cada processo na aba "Processos", ordenadas por `position` ascendente, com indicação do número da etapa e seu nome.

#### Scenario: Processo sem etapas
- **WHEN** um processo não tem etapas cadastradas e o usuário expande a seção de etapas
- **THEN** é exibida mensagem "Nenhuma etapa cadastrada" e, para rank ≥ 3, botão para adicionar a primeira etapa

#### Scenario: Processo com etapas
- **WHEN** um processo tem etapas cadastradas
- **THEN** elas são listadas em ordem de position com rótulo "Etapa N — NomeDaEtapa"

---

### Requirement: Criar etapa em um processo seletivo
O sistema SHALL permitir que assessores e presidentes (rank ≥ 3) criem etapas em qualquer processo via dialog.

#### Scenario: Dialog de criação
- **WHEN** assessor clica em "Nova Etapa" em um processo
- **THEN** dialog é aberto com campos `name` e `position`

#### Scenario: Criação bem-sucedida
- **WHEN** formulário submetido com dados válidos
- **THEN** `POST /selection-process/stages` é chamado e lista de etapas é atualizada

#### Scenario: Conflito de position
- **WHEN** API retorna 409 (posição já existe)
- **THEN** erro é exibido inline: "Já existe uma etapa nessa posição para este processo"

#### Scenario: Usuário sem permissão
- **WHEN** usuário com rank < 3 visualiza etapas
- **THEN** o botão "Nova Etapa" NÃO é exibido
