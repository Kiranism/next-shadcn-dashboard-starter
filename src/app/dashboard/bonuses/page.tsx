/**
 * @file: page.tsx
 * @description: Главная страница управления бонусами
 * @project: SaaS Bonus System
 * @dependencies: BonusManagementPage
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import BonusManagementPage from '@/features/bonuses/components/bonus-management-page';
import { PageContainer } from '@/components/page-container';

export default function BonusesPage() {
  return (
    <PageContainer scrollable>
      <BonusManagementPage />
    </PageContainer>
  );
}
