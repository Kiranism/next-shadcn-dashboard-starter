'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useOrganization, Protect } from '@clerk/nextjs';
import { BadgeCheck, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ExclusivePage() {
  const { organization, isLoaded } = useOrganization();

  return (
    <PageContainer isloading={!isLoaded}>
      <Protect
        plan='pro'
        fallback={
          <div className='flex h-full items-center justify-center'>
            <Alert>
              <Lock className='h-5 w-5 text-yellow-600' />
              <AlertDescription>
                <div className='mb-1 text-lg font-semibold'>
                  Pro Plan Required
                </div>
                <div className='text-muted-foreground'>
                  This page is only available to organizations on the{' '}
                  <span className='font-semibold'>Pro</span> plan.
                  <br />
                  Upgrade your subscription in&nbsp;
                  <a className='underline' href='/dashboard/billing'>
                    Billing &amp; Plans
                  </a>
                  .
                </div>
              </AlertDescription>
            </Alert>
          </div>
        }
      >
        <div className='space-y-6'>
          <div>
            <h1 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
              <BadgeCheck className='h-7 w-7 text-green-600' />
              Exclusive Area
            </h1>
            <p className='text-muted-foreground'>
              Welcome,{' '}
              <span className='font-semibold'>{organization?.name}</span>! This
              page contains exclusive features for Pro plan organizations.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>
                Thank You for Checking Out the Exclusive Page
              </CardTitle>
              <CardDescription>
                This means you belong to an organization subscribed to the Pro
                plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-lg'>Have a wonderful day!</div>
            </CardContent>
          </Card>
        </div>
      </Protect>
    </PageContainer>
  );
}
