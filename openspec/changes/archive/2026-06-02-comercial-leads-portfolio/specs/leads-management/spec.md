## ADDED Requirements

### Requirement: Lead card grid com informações operacionais
O sistema SHALL exibir leads em um grid de cards responsivo (1 coluna mobile, 2 colunas tablet, 3 colunas desktop). Cada card SHALL mostrar: nome da empresa (negrito), dot colorido de status no canto superior direito, nome e cargo do contato principal, telefone do contato principal, lista de serviços de interesse e indicador "+X contatos adicionais" quando houver mais de um contato.

#### Scenario: Card com contato e múltiplos contatos
- **WHEN** o lead possui 3 contatos cadastrados
- **THEN** o card exibe o nome e cargo do primeiro contato, o telefone do primeiro contato, e o texto "+ 2 contatos adicionais"

#### Scenario: Card sem contatos
- **WHEN** o lead não possui nenhum contato
- **THEN** o card exibe "Nenhum contato" no lugar do nome/telefone

#### Scenario: Status dot colorido
- **WHEN** o lead tem status `nao_contatado`
- **THEN** o dot é vermelho/coral
- **WHEN** o lead tem status `em_progresso`
- **THEN** o dot é âmbar/laranja
- **WHEN** o lead tem status `finalizado`
- **THEN** o dot é verde

### Requirement: Filtros de status com contagem
O sistema SHALL exibir filtros de status acima do grid de cards. Cada filtro SHALL mostrar o label e a contagem de leads naquele status. O filtro selecionado SHALL ser refletido na URL via query param `status`.

#### Scenario: Filtrar por status
- **WHEN** o usuário clica no filtro "Em progresso (5)"
- **THEN** o grid exibe apenas leads com status `em_progresso`
- **THEN** a URL contém `?status=em_progresso`

#### Scenario: Limpar filtro
- **WHEN** o usuário clica no filtro já selecionado ou no filtro "Todos"
- **THEN** todos os leads são exibidos

### Requirement: Busca por texto
O sistema SHALL exibir um campo de busca por texto que filtra leads por nome da empresa, nome do contato ou serviço de interesse.

#### Scenario: Busca por nome de empresa
- **WHEN** o usuário digita "Padaria" no campo de busca
- **THEN** apenas leads cujo company_name contém "Padaria" (case-insensitive) são exibidos

### Requirement: Criar lead com endereço via ViaCEP
O sistema SHALL permitir criar um lead através de um formulário em Sheet lateral com todos os campos da API, incluindo endereço. Ao preencher o CEP e perder o foco do campo, o sistema SHALL consultar a API ViaCEP e preencher automaticamente logradouro, bairro, cidade e estado.

#### Scenario: Autocompletar endereço via CEP válido
- **WHEN** o usuário digita um CEP válido de 8 dígitos e sai do campo
- **THEN** os campos logradouro, bairro, cidade e estado são preenchidos automaticamente
- **THEN** um spinner de loading aparece durante a consulta

#### Scenario: CEP inválido ou não encontrado
- **WHEN** o usuário digita um CEP que não existe na ViaCEP
- **THEN** uma mensagem de erro discreta aparece abaixo do campo
- **THEN** os campos de endereço permanecem editáveis manualmente

#### Scenario: Submissão bem-sucedida
- **WHEN** o usuário preenche todos os campos obrigatórios e clica em "Salvar"
- **THEN** o lead é criado via POST /leads
- **THEN** a lista de leads é invalidada e atualizada
- **THEN** o Sheet é fechado

### Requirement: Painel de detalhes do lead em Sheet lateral
O sistema SHALL abrir um Sheet lateral ao clicar em um card de lead. O Sheet SHALL exibir todos os dados do lead (GET /leads/:id), incluindo lista de contatos, comentários e endereço completo.

#### Scenario: Abrir detalhes
- **WHEN** o usuário clica em um card de lead
- **THEN** um Sheet lateral abre com os detalhes completos do lead
- **THEN** a URL é atualizada com o ID do lead (ex: `?lead=<id>`)

#### Scenario: Fechar detalhes
- **WHEN** o usuário fecha o Sheet
- **THEN** a URL retorna ao estado anterior sem o param `lead`

### Requirement: Atualizar status e dados do lead
O sistema SHALL permitir atualizar o status e os dados de um lead via PATCH /leads/:id diretamente no painel de detalhes.

#### Scenario: Mudança de status
- **WHEN** o usuário seleciona um novo status no select do painel de detalhes
- **THEN** PATCH /leads/:id é chamado com o novo status
- **THEN** o card na lista e o painel são atualizados

### Requirement: Gerenciar contatos do lead
O sistema SHALL permitir adicionar, editar e remover contatos de um lead no painel de detalhes. Ao menos um de email ou phone deve ser fornecido.

#### Scenario: Adicionar contato
- **WHEN** o usuário clica em "Adicionar contato" e preenche o formulário
- **THEN** POST /leads/:id/contacts é chamado
- **THEN** o contato aparece na lista

#### Scenario: Editar contato
- **WHEN** o usuário clica no ícone de edição de um contato
- **THEN** os campos ficam editáveis inline ou um mini-dialog abre
- **THEN** PATCH /leads/:id/contacts/:contact_id é chamado ao salvar

#### Scenario: Remover contato
- **WHEN** o usuário clica no ícone de trash de um contato e confirma
- **THEN** DELETE /leads/:id/contacts/:contact_id é chamado
- **THEN** o contato é removido da lista

### Requirement: Gerenciar comentários do lead
O sistema SHALL exibir comentários do lead em ordem cronológica ASC e permitir criar, editar (próprio) e deletar (próprio ou rank superior).

#### Scenario: Criar comentário
- **WHEN** o usuário digita um texto e clica em "Comentar"
- **THEN** POST /leads/:id/comments é chamado
- **THEN** o comentário aparece no final da lista

#### Scenario: Editar comentário próprio
- **WHEN** o usuário clica em editar num comentário seu
- **THEN** o campo de texto fica editável inline
- **THEN** PATCH /leads/:id/comments/:comment_id é chamado ao salvar

#### Scenario: Deletar comentário
- **WHEN** o usuário clica em deletar e confirma
- **THEN** DELETE /leads/:id/comments/:comment_id é chamado
- **THEN** o comentário é removido da lista

### Requirement: Deletar lead
O sistema SHALL permitir deletar um lead (somente criador ou superusuário rank ≥ 3) com confirmação via AlertDialog.

#### Scenario: Confirmar deleção
- **WHEN** o usuário clica em "Excluir lead" e confirma no AlertDialog
- **THEN** DELETE /leads/:id é chamado
- **THEN** o Sheet fecha e o lead é removido da lista
