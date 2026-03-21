'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { CreateTripForm } from '@/features/trips/components/create-trip-form';
import { ArrowLeft } from 'lucide-react';

export default function NewTripPage() {
  const router = useRouter();

  return (
    <PageContainer
      scrollable
      pageTitle='Neue Fahrt'
      pageDescription='Fahrt anlegen — gleiches Formular wie über „Fahrt erstellen“.'
    >
      <div className='mx-auto w-full max-w-3xl'>
        <Button variant='outline' size='sm' className='mb-4 gap-2' asChild>
          <Link href='/dashboard/trips'>
            <ArrowLeft className='h-4 w-4' />
            Zurück zu Fahrten
          </Link>
        </Button>
        <div className='bg-card overflow-hidden rounded-xl border shadow-sm'>
          <CreateTripForm
            onSuccess={() => {
              router.push('/dashboard/trips');
            }}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </PageContainer>
  );
}
