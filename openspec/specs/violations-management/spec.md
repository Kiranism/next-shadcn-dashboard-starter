## ADDED Requirements

### Requirement: Tabela de membros com score de faltas (rank ≥ 1)
O sistema SHALL exibir em `/dashboard/faltas` uma tabela com os membros visíveis ao caller e seus respectivos scores de faltas. Cada linha SHALL mostrar: nome do membro, cargo, setor, score total, contagem de faltas ativas por severidade e badge de risco (`at_risk: true` = destaque vermelho). A visibilidade segue a hierarquia da API: gerente vê subordinados do mesmo setor; diretor vê dois níveis; assessor/presidente veem todos.

#### Scenario: Gerente acessa a página
- **WHEN** um usuário com rank = 1 (gerente) acessa `/dashboard/faltas`
- **THEN** `GET /violations` é chamado e retorna apenas os subordinados do mesmo setor
- **THEN** a tabela exibe esses membros com seus scores

#### Scenario: Assessor ou presidente acessa a página
- **WHEN** um usuário com rank ≥ 3 acessa `/dashboard/faltas`
- **THEN** a tabela exibe todos os membros ativos com seus scores

#### Scenario: Tabela vazia
- **WHEN** o caller não tem subordinados visíveis
- **THEN** uma mensagem de estado vazio é exibida

#### Scenario: Filtro por nome na tabela
- **WHEN** o caller digita um nome no campo de busca
- **THEN** a tabela filtra as linhas pelo nome do membro (case-insensitive)

### Requirement: View de próprias faltas para consultor (rank = 0)
Usuários com rank = 0 (consultor) SHALL ver apenas suas próprias faltas em `/dashboard/faltas`. O sistema SHALL usar `GET /violations/me` e exibir a lista de faltas pessoais com o placar acumulado, sem a tabela de membros.

#### Scenario: Consultor acessa a página
- **WHEN** um usuário com rank = 0 acessa `/dashboard/faltas`
- **THEN** `GET /violations/me` é chamado
- **THEN** a view pessoal é exibida com lista de faltas e summary (`score`, contagem por severidade, badge `at_risk`)

#### Scenario: Consultor sem faltas
- **WHEN** o consultor não possui faltas registradas
- **THEN** uma mensagem de estado vazio é exibida com score = 0

### Requirement: Sheet de detalhamento de faltas por membro
Ao clicar em uma linha da tabela, o sistema SHALL abrir um Sheet lateral com as faltas individuais do membro selecionado. O Sheet SHALL exibir: nome do membro, summary de score, e lista de faltas com código da norma, descrição, severidade (badge colorido), razão, status (`active`/`cancelled`) e data de aplicação.

#### Scenario: Abrir sheet ao clicar em membro
- **WHEN** o caller clica em uma linha da tabela de membros
- **THEN** um Sheet lateral abre com as faltas do membro (`violations[]` do objeto já carregado)
- **THEN** o sheet exibe o placar (`summary`) e a lista de faltas com todos os campos relevantes

#### Scenario: Membro sem faltas no sheet
- **WHEN** o membro selecionado não possui faltas
- **THEN** o Sheet exibe estado vazio dentro da lista de faltas

#### Scenario: Cancelar falta no sheet (rank ≥ 1)
- **WHEN** o caller tem rank ≥ 1 e clica no ícone de cancelar em uma falta ativa
- **THEN** um AlertDialog de confirmação é exibido
- **THEN** ao confirmar, `DELETE /violations/:id` é chamado
- **THEN** a falta é marcada como `cancelled` e a tabela/sheet é atualizado

#### Scenario: Erro ao cancelar falta sem autoridade
- **WHEN** `DELETE /violations/:id` retorna 403
- **THEN** um toast de erro é exibido informando falta de autoridade para cancelar

### Requirement: Aplicar falta a um membro (rank ≥ 1)
O sistema SHALL exibir o botão "Aplicar Falta" para callers com rank ≥ 1. Ao clicar, um Dialog abre com formulário contendo: seletor de membro (subordinados visíveis), seletor de norma (lista de `GET /norms`), e campo de razão opcional.

#### Scenario: Aplicar falta com sucesso
- **WHEN** o caller seleciona membro, norma (e opcionalmente razão) e clica em "Aplicar"
- **THEN** `POST /violations` é chamado com `user_id`, `norm_id` e `reason`
- **THEN** o dialog fecha, a tabela é atualizada e um toast de sucesso é exibido

#### Scenario: Sem autoridade hierárquica sobre o alvo
- **WHEN** `POST /violations` retorna 403
- **THEN** um toast de erro é exibido com mensagem de hierarquia insuficiente e o dialog permanece aberto

#### Scenario: Membro ou norma não encontrado
- **WHEN** `POST /violations` retorna 404
- **THEN** um toast de erro é exibido e o dialog permanece aberto

#### Scenario: Campos obrigatórios ausentes
- **WHEN** o caller tenta aplicar sem selecionar membro ou norma
- **THEN** o formulário exibe erros de validação inline sem enviar a requisição

### Requirement: Badge visual de risco de desligamento
Membros com `summary.at_risk = true` (score ≥ 18) SHALL ter destaque visual na tabela e no sheet: badge vermelho "Em Risco" visível na linha da tabela e no cabeçalho do sheet.

#### Scenario: Membro em risco exibido na tabela
- **WHEN** um membro tem `at_risk = true`
- **THEN** sua linha na tabela exibe um badge vermelho "Em Risco" no campo de score

#### Scenario: Badge de risco no sheet
- **WHEN** o sheet do membro em risco é aberto
- **THEN** o cabeçalho do sheet exibe o badge "Em Risco" junto ao nome do membro
