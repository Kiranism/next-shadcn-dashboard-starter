import { Metadata } from 'next';
import { BonusManagementPage } from '@/features/bonuses/components/bonus-management-page';

export const metadata: Metadata = {
  title: 'Управление бонусами',
  description: 'Система управления бонусами пользователей',
};

export default function BonusesPage() {
  return <BonusManagementPage />;
}