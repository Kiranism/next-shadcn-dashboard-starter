## ADDED Requirements

### Requirement: Página pública de inscrição acessível sem autenticação
O sistema SHALL disponibilizar a rota `/inscricao` como página pública sem autenticação, sem sidebar ou header do dashboard.

#### Scenario: Acesso sem login
- **WHEN** um usuário não autenticado acessa `/inscricao`
- **THEN** a página é exibida normalmente sem redirecionamento para login

#### Scenario: Nenhum processo seletivo ativo
- **WHEN** `GET /selection-process` não retém nenhum processo com data atual dentro do range
- **THEN** é exibida mensagem "Não há processo seletivo ativo no momento. Fique atento às nossas redes sociais!"

---

### Requirement: Formulário de candidatura com todos os campos obrigatórios
O sistema SHALL exibir formulário completo com validação client-side antes de submeter.

#### Scenario: Campos obrigatórios não preenchidos
- **WHEN** o usuário tenta submeter o formulário sem preencher campos obrigatórios
- **THEN** mensagens de erro são exibidas inline em cada campo inválido

#### Scenario: Email duplicado no processo
- **WHEN** a API retorna 409
- **THEN** é exibida mensagem "Já existe uma candidatura com este e-mail neste processo seletivo"

---

### Requirement: Upload de 3 arquivos para Supabase Storage antes de submeter
O sistema SHALL fazer upload de currículo (PDF), histórico escolar (PDF) e foto (imagem) para o bucket `selection-process-files` antes de chamar `POST /selection-process/applications`.

#### Scenario: Upload bem-sucedido dos 3 arquivos
- **WHEN** o usuário seleciona 3 arquivos válidos e submete
- **THEN** os arquivos são enviados para `selection-process-files` e os paths resultantes são incluídos no body da API

#### Scenario: Arquivo com formato inválido
- **WHEN** o usuário tenta selecionar um arquivo .exe ou .zip para currículo
- **THEN** o campo exibe erro "Formato inválido" antes do upload

#### Scenario: Falha no upload de um arquivo
- **WHEN** o Supabase Storage retorna erro para um dos arquivos
- **THEN** o formulário exibe mensagem de erro específica para o arquivo, e `POST /selection-process/applications` NÃO é chamado

---

### Requirement: Feedback visual durante envio
O sistema SHALL exibir estado de carregamento durante o upload e submissão, desabilitando o botão de envio.

#### Scenario: Envio em andamento
- **WHEN** o usuário clica em "Enviar candidatura"
- **THEN** o botão fica desabilitado e exibe indicador de carregamento até a conclusão ou erro

#### Scenario: Candidatura enviada com sucesso
- **WHEN** `POST /selection-process/applications` retorna 201
- **THEN** o formulário é substituído por tela de confirmação com mensagem de sucesso
