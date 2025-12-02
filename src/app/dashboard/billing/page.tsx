'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useOrganization } from '@clerk/nextjs';
import { PricingTable } from '@clerk/nextjs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function BillingPage() {
  const { organization, isLoaded } = useOrganization();

  return (
    <PageContainer
      isloading={!isLoaded}
      access={!!organization}
      accessFallback={
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='space-y-2 text-center'>
            <h2 className='text-2xl font-semibold'>No Organization Selected</h2>
            <p className='text-muted-foreground'>
              Please select or create an organization to view billing
              information.
            </p>
          </div>
        </div>
      }
    >
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Billing & Plans</h1>
          <p className='text-muted-foreground'>
            Manage your subscription and usage limits for {organization?.name}
          </p>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            Plans and subscriptions are managed through Clerk Billing. Subscribe
            to a plan to unlock features and higher limits.
          </AlertDescription>
        </Alert>

        {/* Clerk Pricing Table */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose a plan that fits your organization's needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='mx-auto max-w-4xl'>
              <PricingTable for='organization' />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
