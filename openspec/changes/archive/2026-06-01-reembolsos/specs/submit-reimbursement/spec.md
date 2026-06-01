## ADDED Requirements

### Requirement: Usuário pode submeter solicitação de reembolso
O sistema SHALL permitir que qualquer usuário autenticado crie uma solicitação de reembolso preenchendo título, descrição, valor em BRL (convertido para centavos), categoria, chave PIX e comprovantes opcionais. Antes de chamar `POST /reimbursements`, o sistema SHALL fazer upload de cada comprovante ao bucket Supabase `reimbursement-receipts` com path `receipts/${userId}/${uuid}/${filename}`.

#### Scenario: Submissão bem-sucedida sem comprovantes
- **WHEN** usuário preenche todos os campos obrigatórios e clica em "Enviar Solicitação"
- **THEN** sistema chama `POST /reimbursements` e exibe toast de sucesso, fecha o dialog e invalida a query de reembolsos

#### Scenario: Submissão bem-sucedida com comprovantes
- **WHEN** usuário anexa arquivos, aguarda upload completar e clica em "Enviar Solicitação"
- **THEN** sistema faz upload de cada arquivo ao Supabase, coleta os paths, chama `POST /reimbursements` com `attachments` preenchido e exibe toast de sucesso

#### Scenario: Upload em progresso bloqueia envio
- **WHEN** um ou mais arquivos ainda estão em estado `uploading`
- **THEN** o botão "Enviar Solicitação" permanece desabilitado

#### Scenario: Falha no upload
- **WHEN** o upload de um arquivo falha
- **THEN** sistema exibe erro inline no arquivo específico e o botão de envio permanece desabilitado até que o usuário remova o arquivo com erro ou tente novamente

#### Scenario: Limite de arquivos excedido
- **WHEN** usuário tenta adicionar mais de 5 arquivos
- **THEN** sistema exibe mensagem de aviso e ignora os arquivos excedentes

#### Scenario: Arquivo muito grande
- **WHEN** usuário seleciona arquivo maior que 10MB
- **THEN** sistema exibe erro inline e não inicia o upload

### Requirement: Usuário visualiza suas próprias solicitações
O sistema SHALL exibir uma lista das solicitações do usuário autenticado, obtidas via `GET /reimbursements` (target=me por default), com status badge colorido, valor formatado em BRL, categoria e data de criação.

#### Scenario: Lista com solicitações
- **WHEN** usuário acessa a página Reembolsos
- **THEN** sistema exibe cards com título, categoria, valor (R$), data e badge de status (Pendente/Aprovado/Recusado)

#### Scenario: Lista vazia
- **WHEN** usuário não possui nenhuma solicitação
- **THEN** sistema exibe estado vazio com CTA para criar a primeira solicitação

#### Scenario: Resumo de status
- **WHEN** usuário possui solicitações
- **THEN** sistema exibe contagem por status (Pendente, Aprovado, Recusado) e total aprovado em BRL no topo da página

### Requirement: Responsividade da página Reembolsos
O sistema SHALL renderizar corretamente em dispositivos com largura mínima de 320px, com o dialog de nova solicitação ocupando no máximo 90vw em mobile e o drop zone de upload sendo acessível por toque.

#### Scenario: Layout mobile
- **WHEN** viewport é menor que 640px (sm breakpoint)
- **THEN** cards da lista ocupam largura total, resumo de status usa scroll horizontal se necessário, e o dialog de nova solicitação tem largura de 90vw
