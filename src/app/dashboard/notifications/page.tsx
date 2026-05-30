import PageContainer from '@/components/layout/page-container';
import { RoleGuard } from '@/components/layout/role-guard';
import { SendNotificationForm } from '@/features/notifications/components/send-notification-form';

export const metadata = { title: 'Dashboard: Notificações' };

export default function NotificationsPage() {
  return (
    <RoleGuard minRank={3}>
      <PageContainer
        pageTitle='Notificações'
        pageDescription='Envie notificações dirigidas para colaboradores por setor ou cargo.'
      >
        <SendNotificationForm />
      </PageContainer>
    </RoleGuard>
  );
}
