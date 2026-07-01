## Context

A API já possui as rotas `/norms` e `/violations` implementadas com hierarquia completa. O dashboard precisa expor essas funcionalidades com dois padrões de UX distintos: o Manual de Conduta segue o padrão card-list do Portfólio; a página de Faltas segue o padrão table + sheet lateral do módulo de Usuários.

O sistema de hierarquia de violations é complexo:
- `GET /violations` filtra automaticamente os membros visíveis ao caller (gerente vê subordinados do mesmo setor; diretor vê dois níveis; assessor/presidente veem todos)
- `POST /violations` exige que o caller tenha autoridade hierárquica sobre o alvo
- Consultor só vê suas próprias faltas via `GET /violations/me`

## Goals / Non-Goals

**Goals:**
- Página `/dashboard/manual-de-conduta`: listagem de normas legível para todos, CRUD completo para superusuários via dialogs
- Página `/dashboard/faltas`: tabela de membros com score acumulado, sheet de detalhamento por membro, modal para aplicar falta
- Seguir exatamente o padrão de repositório do projeto: `repository.ts` com query keys, `useQuery`/`useMutation`, invalidação
- Responsividade completa (mobile-first)
- Ícones distintos dos já usados (`post` para Manual, `warning` para Faltas)

**Non-Goals:**
- Edição de faltas após criação (a API só suporta cancelamento via DELETE)
- Visualização de faltas de colegas de mesmo rank (API não expõe isso)
- Filtros avançados na tabela de Faltas além da busca por nome

## Decisions

### 1. Estrutura de features separadas

Criar `src/features/norms/` e `src/features/violations/` separadas, cada uma com seu `repository.ts` em `src/repositories/`. Razão: isola as responsabilidades e segue o padrão do projeto (um repositório por domínio).

### 2. Manual de Conduta: cards com badge de severidade

Cada norma é exibida como card com código (`AN01`), descrição e badge colorido de severidade (`leve` = verde, `moderada` = amarelo, `grave` = laranja, `desligamento` = vermelho). Superusuários veem botões de editar/deletar em cada card. Alternativa descartada: tabela — a quantidade de normas é pequena e a leitura como documento se beneficia do layout card.

### 3. Faltas: tabela de membros + sheet lateral

`GET /violations` retorna um array de `{ user_id, violations[], summary }`. A tabela mostra `user_id` (resolvido para nome via `GET /users`), score, contagem por severidade e badge de risco. Ao clicar numa linha, abre um Sheet lateral com as faltas individuais do membro.

Para o consultor: a página redireciona para uma view simplificada usando `GET /violations/me` mostrando apenas as próprias faltas (sem tabela de membros).

Alternativa descartada: modal para detalhamento — Sheet é mais adequado pois a lista de faltas pode ser longa e beneficia de mais espaço vertical.

### 4. Aplicar falta: modal separado

Botão "Aplicar Falta" abre um Dialog com formulário: seletor de membro (dropdown filtrado pelos subordinados visíveis), seletor de norma (dropdown de `GET /norms`), e campo de razão opcional. O caller só pode aplicar faltas a membros que a API permitiria (hierarquia verificada no backend — um 403 deve ser tratado com toast de erro claro).

### 5. Cancelar falta no sheet

Dentro do Sheet de detalhamento, faltas individuais têm botão de cancelar (ícone trash) que chama `DELETE /violations/:id`. A autorização (criador ou rank superior) é verificada no backend; o botão é mostrado se o caller tiver rank > 0 (gerente ou superior).

### 6. Resolução de nomes de usuário

`GET /violations` retorna `user_id` mas não `name`. O repositório de users já possui `useList()`. A tabela de faltas combina os dados: usa `violations` do endpoint de violations e enriquece com nome via users cache. Não cria endpoint dedicado.

## Risks / Trade-offs

- **N+1 de usuários** → Mitigation: `useList()` de usuários já traz todos; merge client-side por `user_id` sem requisições adicionais.
- **Consultor vê tela diferente** → Mitigation: lógica de branching clara no page.tsx com base em `rank === 0`; não expõe rotas administrativas.
- **Normas com faltas associadas não podem ser deletadas (409)** → Mitigation: AlertDialog de deleção exibe toast de erro com mensagem da API quando backend retorna 409.
