## 1. Camada de API de Notificações

- [x] 1.1 Criar `src/features/notifications/api/types.ts` com tipos `Notification`, `NotificationOrigin`, `SendNotificationPayload`, `SendNotificationResponse`
- [x] 1.2 Criar `src/features/notifications/api/service.ts` com `getNotifications(token)` chamando `GET /notifications` e `deleteNotification(token, id)` chamando `DELETE /notifications/:id`
- [x] 1.3 Adicionar `sendNotification(token, payload)` em `service.ts` chamando `POST /notifications` e retornando `{ count: number }`
- [x] 1.4 Criar `src/features/notifications/api/queries.ts` com `notificationKeys` factory e `notificationsQueryOptions(token)` com `refetchInterval: 60_000`

## 2. Central de Notificações (componente de sidebar)

- [x] 2.1 Criar `src/features/notifications/components/notification-item.tsx` com layout de item individual (título, descrição, badge de origem, data pt-BR, botão de descarte com área de toque ≥ 44px)
- [x] 2.2 Criar `src/features/notifications/components/notification-center.tsx` — `Sheet` lateral com lista de notificações, estado vazio e skeleton loaders; usa `useMutation` para delete com update otimista
- [x] 2.3 Modificar `src/components/layout/sidebar-user-footer.tsx` para importar contagem de notificações via `useQuery(notificationsQueryOptions)`, exibir badge sobre avatar quando sidebar colapsado e adicionar botão de sino com badge acima do menu de avatar
- [x] 2.4 Integrar o trigger do `Sheet` de notificações no `SidebarFooter` — o botão de sino abre o `NotificationCenter` como `Sheet` com `side="right"`

## 3. Página de Envio de Notificações (admin)

- [x] 3.1 Criar `src/features/notifications/components/send-notification-form.tsx` com `useAppForm` — campos `title` (Input obrigatório), `description` (Textarea opcional), `target.sector` (Select), `target.role` (Select); usa `useMutation` via `sendNotification`
- [x] 3.2 Criar `src/app/dashboard/notifications/page.tsx` com `RoleGuard minRank={3}`, `PageContainer` com `pageTitle="Notificações"` e `pageDescription`, e o `SendNotificationForm`
- [x] 3.3 Adicionar item "Notificações" ao grupo "Administração" em `src/config/nav-config.ts` com `url: '/dashboard/notifications'`, `icon: 'bell'`, `minRank: 3`, posicionado após "Usuários"

## 4. Ícone e Polimento

- [x] 4.1 Verificar se o ícone `bell` existe em `src/components/icons.tsx`; adicionar se ausente (do `@tabler/icons-react` reexportando via `Icons`)
- [x] 4.2 Garantir que o badge de contagem exiba "9+" para contagens ≥ 10
- [x] 4.3 Verificar responsividade do `Sheet` em viewport 375px (largura ≥ 85% da tela)
- [x] 4.4 Testar toast de sucesso com `count` e toast de erro para falha na API
