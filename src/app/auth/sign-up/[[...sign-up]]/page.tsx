import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Регистрация | SaaS Bonus System',
  description: 'Создайте новый аккаунт администратора.'
};

export default async function Page() {
  return <SignUpViewPage />;
}
