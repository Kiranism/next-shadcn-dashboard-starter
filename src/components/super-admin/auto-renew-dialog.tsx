/**
 * @file: src/components/super-admin/auto-renew-dialog.tsx
 * @description: Диалог управления автопродлением и сохранённой картой ЮKassa
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, CreditCard, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export interface AutoRenewSubscription {
  id: string;
  status: string;
  autoRenewEnabled?: boolean;
  paymentMethod?: string | null;
  nextPaymentDate?: string | null;
  adminAccount: { email: string };
  plan: { name: string };
}

interface AutoRenewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: AutoRenewSubscription;
  onSuccess: () => void;
}

function maskPaymentMethodId(id: string | null | undefined): string {
  if (!id) return '—';
  if (id.length <= 8) return `•••• ${id}`;
  return `•••• ${id.slice(-8)}`;
}

export function AutoRenewDialog({
  open,
  onOpenChange,
  subscription,
  onSuccess
}: AutoRenewDialogProps) {
  const [enabled, setEnabled] = useState(
    subscription.autoRenewEnabled ?? false
  );
  const [loading, setLoading] = useState(false);
  const [removingCard, setRemovingCard] = useState(false);

  useEffect(() => {
    if (open) {
      setEnabled(subscription.autoRenewEnabled ?? false);
    }
  }, [open, subscription.autoRenewEnabled]);

  const hasSavedCard = Boolean(subscription.paymentMethod);

  const save = async (options: {
    enabled: boolean;
    removePaymentMethod?: boolean;
  }) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/super-admin/subscriptions/${subscription.id}/auto-renew`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options)
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Не удалось обновить автопродление');
      }

      toast.success(
        options.removePaymentMethod
          ? 'Сохранённая карта удалена'
          : options.enabled
            ? 'Автопродление включено'
            : 'Автопродление отключено'
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка обновления');
    } finally {
      setLoading(false);
      setRemovingCard(false);
    }
  };

  const handleSaveToggle = () => {
    void save({ enabled, removePaymentMethod: !enabled && hasSavedCard });
  };

  const handleRemoveCard = () => {
    setRemovingCard(true);
    void save({ enabled: false, removePaymentMethod: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <RefreshCw className='h-5 w-5' />
            Автопродление
          </DialogTitle>
          <DialogDescription>
            {subscription.adminAccount.email} — тариф «{subscription.plan.name}»
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='space-y-2 rounded-lg border p-4'>
            <div className='flex items-center gap-2 text-sm font-medium'>
              <CreditCard className='h-4 w-4' />
              Сохранённый способ оплаты
            </div>
            <p className='text-muted-foreground text-sm'>
              {hasSavedCard
                ? `ЮKassa ID: ${maskPaymentMethodId(subscription.paymentMethod)}`
                : 'Карта не привязана'}
            </p>
            {subscription.nextPaymentDate && (
              <p className='text-muted-foreground text-sm'>
                Следующее списание:{' '}
                {new Date(subscription.nextPaymentDate).toLocaleDateString(
                  'ru-RU'
                )}
              </p>
            )}
          </div>

          <div className='flex items-center justify-between gap-4'>
            <div className='space-y-1'>
              <Label htmlFor='auto-renew-toggle'>Автопродление</Label>
              <p className='text-muted-foreground text-xs'>
                Списание без повторного ввода карты
              </p>
            </div>
            <Switch
              id='auto-renew-toggle'
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={loading || !hasSavedCard}
            />
          </div>

          {!hasSavedCard && (
            <p className='text-muted-foreground text-xs'>
              Включить автопродление можно после оплаты с сохранением карты.
            </p>
          )}
        </div>

        <DialogFooter className='flex-col gap-2 sm:flex-row sm:justify-between'>
          {hasSavedCard && (
            <Button
              type='button'
              variant='destructive'
              onClick={handleRemoveCard}
              disabled={loading}
            >
              {removingCard && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Удалить карту
            </Button>
          )}
          <div className='flex gap-2 sm:ml-auto'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Закрыть
            </Button>
            <Button onClick={handleSaveToggle} disabled={loading}>
              {loading && !removingCard && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Сохранить
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
