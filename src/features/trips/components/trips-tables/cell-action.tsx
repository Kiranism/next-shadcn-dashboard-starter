'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Edit, MoreHorizontal, Eye, Trash, Share2 } from 'lucide-react';
import { useState } from 'react';
import { TripDetailSheet } from '@/features/overview/components/trip-detail-sheet';
import { useRouter } from 'next/navigation';
import type { Trip } from '@/features/trips/api/trips.service';
import { useTripCancellation } from '@/features/trips/hooks/use-trip-cancellation';
import { hasPairedLeg } from '@/features/trips/api/recurring-exceptions.actions';
import { RecurringTripCancelDialog } from '@/features/trips/components/recurring-trip-cancel-dialog';
import { copyTripToClipboard } from '@/features/trips/lib/share-utils';
import { toast } from 'sonner';

interface CellActionProps {
  data: Trip;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hasPair, setHasPair] = useState(false);
  const router = useRouter();
  const { cancelTrip, isLoading } = useTripCancellation();

  const isRecurring = !!data.rule_id;

  const handleOpenDeleteDialog = async () => {
    setIsDeleteDialogOpen(true);

    try {
      const pairExists = await hasPairedLeg(data);
      setHasPair(pairExists);
    } catch {
      setHasPair(false);
    }
  };

  const handleDeleteSingle = async () => {
    await cancelTrip(
      data,
      isRecurring ? 'skip-occurrence' : 'single-nonrecurring',
      {
        source: 'Manually cancelled via Trips Table'
      }
    );
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteWithPair = async () => {
    await cancelTrip(data, 'skip-occurrence-and-paired', {
      source: 'Manually cancelled (Hin/Rück) via Trips Table'
    });
    setIsDeleteDialogOpen(false);
  };

  const handleCancelSeries = async () => {
    await cancelTrip(data, 'cancel-series', {
      source: 'Recurring series cancelled via Trips Table'
    });
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Menü öffnen</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsDetailOpen(true)}>
            <Eye className='mr-2 h-4 w-4' /> Details anzeigen
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Edit className='mr-2 h-4 w-4' /> Bearbeiten
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              const success = await copyTripToClipboard(data);
              if (success) {
                toast.success('Details in die Zwischenablage kopiert');
              } else {
                toast.error('Kopieren fehlgeschlagen');
              }
            }}
          >
            <Share2 className='mr-2 h-4 w-4' /> QuickShare (WhatsApp)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              // fire and forget, dialog opens immediately and pair check runs in background
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              handleOpenDeleteDialog();
            }}
            className='text-destructive focus:text-destructive'
          >
            <Trash className='mr-2 h-4 w-4' /> Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TripDetailSheet
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        tripId={data.id}
      />

      <RecurringTripCancelDialog
        trip={data}
        hasPair={hasPair}
        isOpen={isDeleteDialogOpen}
        isLoading={isLoading}
        title='Fahrt löschen?'
        description='Möchten Sie diese Fahrt wirklich löschen?'
        onOpenChange={setIsDeleteDialogOpen}
        onConfirmSingle={(reason) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          cancelTrip(
            data,
            isRecurring ? 'skip-occurrence' : 'single-nonrecurring',
            {
              source: 'Manually cancelled via Trips Table',
              reason
            }
          ).finally(() => setIsDeleteDialogOpen(false));
        }}
        onConfirmWithPair={
          isRecurring && hasPair
            ? (reason) => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                cancelTrip(data, 'skip-occurrence-and-paired', {
                  source: 'Manually cancelled (Hin/Rück) via Trips Table',
                  reason
                }).finally(() => setIsDeleteDialogOpen(false));
              }
            : undefined
        }
        onConfirmSeries={
          isRecurring
            ? (reason) => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                cancelTrip(data, 'cancel-series', {
                  source: 'Recurring series cancelled via Trips Table',
                  reason
                }).finally(() => setIsDeleteDialogOpen(false));
              }
            : undefined
        }
        singleLabel={
          isRecurring ? 'Nur diese Fahrt stornieren (Aussetzen)' : 'Löschen'
        }
        pairLabel='Diese Fahrt & Rückfahrt stornieren'
        seriesLabel='Gesamte Serie beenden'
      />
    </>
  );
};
