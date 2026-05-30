## MODIFIED Requirements

### Requirement: `nav-config.ts` como fonte única de verdade para acesso a páginas
Cada item de página em `nav-config.ts` SHALL declarar o `minRank` necessário para acesso. Este campo SHALL ser lido por três consumidores: navbar (já existente), middleware e barra de busca. Nenhum consumidor SHALL duplicar a lógica de permissão — todos leem do mesmo objeto de configuração. O grupo "Administração" SHALL incluir o item "Notificações" apontando para `/dashboard/notifications` com `minRank: 3`, posicionado após "Usuários".

#### Scenario: Novo item de página adicionado ao nav-config
- **WHEN** um desenvolvedor adiciona um item com `minRank: 3` em `nav-config.ts`
- **THEN** a navbar SHALL ocultar o item para usuários com rank < 3, o middleware SHALL redirecionar esses usuários ao acessar a rota diretamente, e a kbar SHALL não exibir o item na busca

#### Scenario: Configuração de acesso alterada
- **WHEN** o `minRank` de uma página é alterado em `nav-config.ts`
- **THEN** os três consumidores SHALL refletir a mudança sem alteração de código adicional

#### Scenario: Item "Notificações" visível para superusuário
- **WHEN** um usuário com rank ≥ 3 acessa o dashboard
- **THEN** o item "Notificações" SHALL aparecer na navbar no grupo "Administração" após "Usuários"

#### Scenario: Item "Notificações" oculto para usuário comum
- **WHEN** um usuário com rank < 3 acessa o dashboard
- **THEN** o item "Notificações" SHALL não aparecer na navbar nem na kbar
