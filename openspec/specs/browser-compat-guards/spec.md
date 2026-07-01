## ADDED Requirements

### Requirement: Constante isClient para guards de SSR
O projeto SHALL exportar uma constante `isClient` em `src/lib/is-client.ts` que retorna `true` somente quando executado no browser (não no servidor).

#### Scenario: Acesso no browser
- **WHEN** o código é executado após a hidratação do React no browser
- **THEN** `isClient` SHALL ser `true` e acessos a `window`, `navigator` e `document` SHALL ser seguros

#### Scenario: Acesso no servidor (SSR)
- **WHEN** o código é executado no servidor Next.js durante SSR
- **THEN** `isClient` SHALL ser `false` e nenhum acesso a APIs de browser SHALL ocorrer

### Requirement: Hooks de responsividade com estado inicial undefined
Os hooks `useIsMobile` e `useMediaQuery` SHALL iniciar com estado `undefined` no servidor e resolver para `boolean` somente após a hidratação no cliente.

#### Scenario: Primeiro render (SSR)
- **WHEN** o servidor renderiza um componente que usa `useIsMobile` ou `useMediaQuery`
- **THEN** o valor retornado SHALL ser `undefined`, evitando mismatch de hidratação

#### Scenario: Após hidratação no cliente
- **WHEN** o componente hidrata no browser
- **THEN** o hook SHALL resolver para `true` (mobile) ou `false` (desktop) com base em `window.matchMedia`

#### Scenario: Componente usando `useIsMobile` trata undefined
- **WHEN** `useIsMobile()` retorna `undefined`
- **THEN** o componente SHALL renderizar o layout padrão (desktop) sem erro

### Requirement: Datas dinâmicas fora do render síncrono
Componentes que exibem datas calculadas no cliente (ex: "há X horas", data atual) SHALL usar `useEffect` com estado inicial `null` para evitar mismatch entre servidor e cliente.

#### Scenario: Render inicial com data null
- **WHEN** o servidor renderiza um componente com data dinâmica
- **THEN** o placeholder SHALL ser exibido (traço ou skeleton) sem lançar erro de hidratação

#### Scenario: Data resolvida após hidratação
- **WHEN** o `useEffect` dispara no cliente
- **THEN** a data real SHALL ser exibida substituindo o placeholder

### Requirement: Fallbacks CSS para cores oklch
O arquivo `src/styles/globals.css` SHALL conter declarações de fallback `hsl()` imediatamente antes de cada variável `oklch()` nos blocos `:root`, `:root.dark`, e blocos de tema.

#### Scenario: Safari 15 sem suporte a oklch
- **WHEN** o app é carregado em Safari 15.3 ou anterior
- **THEN** as variáveis CSS SHALL usar os valores `hsl()` de fallback e o layout SHALL renderizar com cores corretas (não em branco)

#### Scenario: Chrome/Firefox com suporte a oklch
- **WHEN** o app é carregado em browser moderno
- **THEN** as variáveis CSS SHALL usar os valores `oklch()` (declaração posterior sobrescreve o fallback)
