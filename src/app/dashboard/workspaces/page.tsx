'use client';

import PageContainer from '@/components/layout/page-container';
import { OrganizationList } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';

export default function WorkspacesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='Manage your workspaces and switch between them'
    >
      <OrganizationList
        appearance={{
          baseTheme: isDark ? dark : undefined,
          elements: {
            organizationListBox: 'space-y-2',
            organizationPreview: 'rounded-lg border p-4 hover:bg-accent',
            organizationPreviewMainIdentifier: 'text-lg font-semibold',
            organizationPreviewSecondaryIdentifier:
              'text-sm text-muted-foreground'
          }
        }}
        afterSelectOrganizationUrl='/dashboard/workspaces/team'
        afterCreateOrganizationUrl='/dashboard/workspaces/team'
      />
    </PageContainer>
  );
}
