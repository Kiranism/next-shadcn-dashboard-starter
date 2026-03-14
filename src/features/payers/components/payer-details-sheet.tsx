'use client';

import { useState } from 'react';
import { Plus, Receipt, Settings2, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useBillingTypes } from '../hooks/use-billing-types';
import { usePayers } from '../hooks/use-payers';
import { AddBillingTypeDialog } from './add-billing-type-dialog';
import { BillingTypeBehaviorDialog } from './billing-type-behavior-dialog';
import type { PayerWithBillingCount, BillingType } from '../types/payer.types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface PayerDetailsSheetProps {
  payer: PayerWithBillingCount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayerDetailsSheet({
  payer,
  open,
  onOpenChange
}: PayerDetailsSheetProps) {
  const {
    data: billingTypes,
    isLoading,
    deleteBillingType,
    isDeleting
  } = useBillingTypes(payer?.id);
  const { updatePayer, isUpdating } = usePayers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [behaviorDialogItem, setBehaviorDialogItem] =
    useState<BillingType | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');

  // Update edit state when payer changes or edit mode opens
  const startEditing = () => {
    if (payer) {
      setEditName(payer.name);
      setEditNumber(payer.number || '');
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!payer) return;
    try {
      await updatePayer({ id: payer.id, name: editName, number: editNumber });
      toast.success('Kostenträger aktualisiert');
      setIsEditing(false);
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  if (!payer) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) setIsEditing(false);
      }}
    >
      <SheetContent className='w-[90vw] overflow-y-auto px-8 sm:max-w-xl sm:px-12'>
        <SheetHeader className='mb-6'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder='Name'
                  className='focus-visible:border-primary mb-1 h-10 rounded-none border-0 border-b px-0 text-2xl font-semibold focus-visible:ring-0'
                  autoFocus
                />
              ) : (
                <SheetTitle className='text-2xl'>{payer.name}</SheetTitle>
              )}
              <SheetDescription>
                Verwalten Sie Einstellungen und Abrechnungsarten.
              </SheetDescription>
            </div>
            <div className='flex gap-2'>
              {isEditing ? (
                <>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setIsEditing(false)}
                    disabled={isUpdating}
                  >
                    Abbrechen
                  </Button>
                  <Button size='sm' onClick={handleSave} disabled={isUpdating}>
                    {isUpdating ? 'Lädt...' : 'Speichern'}
                  </Button>
                </>
              ) : (
                <Button variant='outline' size='sm' onClick={startEditing}>
                  Bearbeiten
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className='space-y-8'>
          {/* Payer Info Card */}
          <div className='bg-card rounded-xl border p-5 shadow-sm'>
            <div className='flex items-center gap-4'>
              <div className='bg-muted rounded-lg p-3'>
                <Receipt className='text-muted-foreground h-6 w-6' />
              </div>
              <div className='flex-1'>
                {isEditing ? (
                  <Input
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    placeholder='Kostenträgernummer'
                    className='mb-1 h-8 px-2 py-1'
                  />
                ) : (
                  <div className='text-foreground text-lg font-bold'>
                    {payer.number || '–'}
                  </div>
                )}
                <div className='text-muted-foreground text-sm'>
                  Kostenträgernummer
                </div>
              </div>
            </div>
          </div>

          {/* Billing Types Section */}
          <div>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-lg font-semibold'>Abrechnungsarten</h3>
              <Button
                size='sm'
                className='h-8 gap-1'
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className='h-3.5 w-3.5' />
                Neu
              </Button>
            </div>

            <div className='space-y-3'>
              {isLoading ? (
                <>
                  <Skeleton className='h-20 w-full rounded-xl' />
                  <Skeleton className='h-20 w-full rounded-xl' />
                  <Skeleton className='h-20 w-full rounded-xl' />
                </>
              ) : !billingTypes?.length ? (
                <div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center'>
                  <div className='bg-muted mb-3 flex h-12 w-12 items-center justify-center rounded-full'>
                    <Receipt className='text-muted-foreground/50 h-6 w-6' />
                  </div>
                  <h4 className='text-muted-foreground/80 mb-1 font-medium'>
                    Noch keine Abrechnungsarten
                  </h4>
                  <p className='text-muted-foreground max-w-[200px] text-xs'>
                    Klicken Sie oben auf "Neu", um eine hinzuzufügen.
                  </p>
                </div>
              ) : (
                billingTypes.map((item) => (
                  <BillingTypeCard
                    key={item.id}
                    item={item}
                    onDelete={() => deleteBillingType(item.id)}
                    onEditBehavior={() => setBehaviorDialogItem(item)}
                    isDeleting={isDeleting}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>

      <AddBillingTypeDialog
        payerId={payer.id}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        existingBillingTypes={billingTypes || []}
      />

      <BillingTypeBehaviorDialog
        payerId={payer.id}
        billingType={behaviorDialogItem}
        open={!!behaviorDialogItem}
        onOpenChange={(isOpen) => !isOpen && setBehaviorDialogItem(null)}
      />
    </Sheet>
  );
}

function BillingTypeCard({
  item,
  onDelete,
  onEditBehavior,
  isDeleting
}: {
  item: BillingType;
  onDelete: () => void;
  onEditBehavior: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className='group bg-card relative z-10 flex items-center justify-between overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md'>
      {/* Background tint based on color */}
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.03]'
        style={{ backgroundColor: item.color }}
      />

      <div className='relative z-10 flex items-center gap-4'>
        <div
          className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border'
          style={{ backgroundColor: `${item.color}15` }}
        >
          <div
            className='h-5 w-5 rounded-full'
            style={{ backgroundColor: item.color }}
          />
        </div>
        <div>
          <h4 className='font-semibold'>{item.name}</h4>
          <div className='mt-1 flex flex-wrap gap-2'>
            {item.behavior_profile?.lockPickup && (
              <span className='bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase'>
                Sperrt Abholung
              </span>
            )}
            {(item.behavior_profile?.returnPolicy === 'time_tbd' ||
              (item.behavior_profile?.returnPolicy as any) ===
                'create_placeholder') && (
              <span className='bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase'>
                Rückfahrt Auto
              </span>
            )}
          </div>
        </div>
      </div>

      <div className='relative z-10 flex items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8'
          onClick={onEditBehavior}
          title='Verhalten konfigurieren'
        >
          <Settings2 className='h-4 w-4' />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8'
              title='Löschen'
              disabled={isDeleting}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Abrechnungsart löschen</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie "{item.name}" wirklich löschen? Diese Aktion kann
                nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
