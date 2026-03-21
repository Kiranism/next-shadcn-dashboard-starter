'use client';

/**
 * Sticky submit row: stacks on very narrow screens with taller buttons for touch.
 */
import { Button } from '@/components/ui/button';
import { Users, ChevronRight } from 'lucide-react';
import { useTripFormSections } from './trip-form-sections-context';

export function CreateTripFormFooter() {
  const { passengers, isSubmitting, onCancel } = useTripFormSections();

  return (
    <div className='bg-muted/30 flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
      {passengers.length > 0 && (
        <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          <Users className='h-3.5 w-3.5' />
          <span>
            {passengers.length} Fahrgast{passengers.length !== 1 ? 'e' : ''}
          </span>
        </div>
      )}
      <div className='flex w-full items-center justify-end gap-2 sm:ml-auto sm:w-auto'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onCancel}
          disabled={isSubmitting}
          className='min-h-11 min-w-[5rem] sm:min-h-9'
        >
          Abbrechen
        </Button>
        <Button
          type='submit'
          size='sm'
          disabled={isSubmitting}
          className='min-h-11 gap-1.5 sm:min-h-9'
        >
          {isSubmitting ? (
            <>
              <span className='border-background h-4 w-4 animate-spin rounded-full border-2 border-t-transparent' />
              Erstellt...
            </>
          ) : (
            <>
              {passengers.length > 1
                ? `${passengers.length} Fahrten erstellen`
                : 'Fahrt erstellen'}
              <ChevronRight className='h-3.5 w-3.5' />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
