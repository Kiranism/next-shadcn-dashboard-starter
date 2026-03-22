'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { CreateTripForm } from '@/features/trips/components/create-trip-form';
import { ArrowLeft } from 'lucide-react';

export default function NewTripPage() {
  const router = useRouter();
  const [isFormDirty, setIsFormDirty] = React.useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = React.useState(false);

  const handleCancel = () => {
    if (isFormDirty) {
      setCloseConfirmOpen(true);
      return;
    }
    router.back();
  };

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
            onDirtyChange={setIsFormDirty}
            onSuccess={() => {
              router.push('/dashboard/trips');
            }}
            onCancel={handleCancel}
          />
        </div>
      </div>

      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erstellung abbrechen?</AlertDialogTitle>
            <AlertDialogDescription>
              Ein Entwurf kann auf diesem Gerät gespeichert sein. Trotzdem
              verlassen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='touch-manipulation'>
              Weiter bearbeiten
            </AlertDialogCancel>
            <AlertDialogAction
              className='touch-manipulation'
              onClick={() => router.back()}
            >
              Verlassen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
