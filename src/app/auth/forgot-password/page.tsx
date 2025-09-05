import { Metadata } from 'next';
import ForgotPasswordViewPage from '@/features/auth/components/forgot-password-view';

export const metadata: Metadata = {
  title: 'Восстановление пароля | SaaS Bonus System',
  description: 'Восстановите доступ к вашему аккаунту.'
};

export default function Page() {
  return <ForgotPasswordViewPage />;
}
