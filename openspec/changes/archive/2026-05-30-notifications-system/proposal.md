## Why

O sistema já possui endpoints completos de notificações na WattAPI (`GET /notifications`, `DELETE /notifications/:id`, `POST /notifications`), mas o frontend não expõe nenhuma dessas funcionalidades — superusuários não têm como enviar notificações dirigidas e usuários não têm como visualizá-las. A implementação fecha essa lacuna crítica de comunicação interna.

## What Changes

- **Nova página `/dashboard/notifications`** restrita a superusuários (rank ≥ 3), na seção "Administração" ao lado de "Usuários", com formulário para envio de notificações dirigidas com filtros de setor e cargo.
- **Central de notificações no sidebar** acessível via botão acima do avatar do usuário no `SidebarFooter`, exibindo todas as notificações não deletadas do usuário autenticado com opção de marcar como deletada (soft delete).
- **Badge de contagem** sobre o avatar de perfil no `SidebarUserFooter` indicando número de notificações não lidas (todas as presentes, já que a API não tem campo "lida").

## Capabilities

### New Capabilities

- `notifications-send`: Página administrativa para envio de notificações dirigidas por superusuários, consumindo `POST /notifications` com filtros de setor/role.
- `notification-center`: Central de notificações no sidebar para todos os usuários, consumindo `GET /notifications` (polling/refetch periódico) e `DELETE /notifications/:id` para descarte individual.

### Modified Capabilities

- `user-access`: O `nav-config.ts` ganha um novo item "Notificações" no grupo Administração com `minRank: 3`, passando a ser lido pelo middleware e kbar conforme o requisito existente de fonte única de verdade.

## Impact

- **Arquivos novos:** `src/app/dashboard/notifications/page.tsx`, `src/features/notifications/api/types.ts`, `src/features/notifications/api/service.ts`, `src/features/notifications/api/queries.ts`, `src/features/notifications/components/notification-center.tsx`, `src/features/notifications/components/send-notification-form.tsx`
- **Arquivos modificados:** `src/config/nav-config.ts` (novo item de nav), `src/components/layout/sidebar-user-footer.tsx` (badge + botão da central), `src/components/layout/app-sidebar.tsx` (integração do trigger da central)
- **APIs consumidas:** `GET /notifications`, `DELETE /notifications/:id`, `POST /notifications`
- **Dependências:** Nenhuma nova — usa React Query (já instalado), shadcn/ui components existentes (`Sheet`, `Badge`, `Button`, `Popover` ou sheet lateral), `nuqs` para eventual filtro de data na página admin
