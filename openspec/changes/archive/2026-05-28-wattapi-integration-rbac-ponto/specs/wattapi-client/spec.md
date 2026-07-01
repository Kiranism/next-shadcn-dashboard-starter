## ADDED Requirements

### Requirement: Cliente HTTP base para o wattapi
O sistema SHALL expor funções `apiGet`, `apiPost`, `apiPatch`, `apiDelete` em `src/lib/api-client.ts` que realizam chamadas REST ao wattapi com o bearer token da sessão Supabase injetado automaticamente no header `Authorization`.

A base URL SHALL ser lida de `process.env.NEXT_PUBLIC_API_URL`, com fallback para `http://localhost:3001`.

#### Scenario: Chamada autenticada bem-sucedida
- **WHEN** uma função do api-client é chamada com um token válido
- **THEN** a requisição é enviada com `Authorization: Bearer <token>` e a resposta é retornada como JSON tipado

#### Scenario: Token ausente ou sessão inválida
- **WHEN** o token é `null` ou `undefined`
- **THEN** a função lança um erro `Unauthorized` sem realizar a requisição HTTP

#### Scenario: Resposta com erro HTTP (4xx/5xx)
- **WHEN** o wattapi retorna status >= 400
- **THEN** a função lança um erro com a mensagem retornada pelo servidor, preservando o status code

### Requirement: Tipagem de resposta genérica
O api-client SHALL ser genérico em TypeScript, permitindo que o chamador especifique o tipo de retorno esperado (ex: `apiGet<UserResponse>('/auth/me', token)`).

#### Scenario: Inferência de tipo no consumidor
- **WHEN** o consumidor especifica o tipo genérico na chamada
- **THEN** o TypeScript infere corretamente o tipo do valor retornado
