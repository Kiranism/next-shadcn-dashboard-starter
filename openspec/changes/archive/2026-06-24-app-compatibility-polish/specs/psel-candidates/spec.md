## ADDED Requirements

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

### Requirement: Entrevista PSEL acessível sem autenticação em qualquer browser
A página `/psel/entrevistas/[token]` SHALL funcionar em browsers modernos sem dependências de APIs não disponíveis (push, serviceWorker) e sem exigir autenticação do candidato.

#### Scenario: Acesso via token válido em Safari 15+
- **WHEN** um candidato acessa o link de entrevista com token válido em Safari 15
- **THEN** a página SHALL carregar corretamente, exibir as informações da entrevista e permitir as ações disponíveis sem erro

#### Scenario: Componentes da entrevista sem erros de hidratação
- **WHEN** a página de entrevista é renderizada pelo servidor e hidratada no cliente
- **THEN** nenhum erro de hidratação React SHALL ocorrer no console do browser
