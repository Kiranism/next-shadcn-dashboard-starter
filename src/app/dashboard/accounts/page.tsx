/**
 * @file: src/app/dashboard/accounts/page.tsx
 * @description: Управление аккаунтами администраторов
 * @project: SaaS Bonus System
 * @dependencies: React, fetch API, shadcn/ui
 * @created: 2025-09-07
 * @updated: 2026-06-14 (приведение к дизайн-системе, замена prompt на диалог)
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Account = {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'MANAGER';
  isActive: boolean;
};

export default function AccountsPage() {
  const [items, setItems] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  // Состояние диалога сброса пароля
  const [resetTarget, setResetTarget] = useState<Account | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounts');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (e) {
      toast.error('Не удалось загрузить аккаунты');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setActive(id: string, isActive: boolean) {
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive })
      });
      if (!res.ok) throw new Error();
      toast.success('Статус обновлён');
      load();
    } catch {
      toast.error('Ошибка при обновлении статуса');
    }
  }

  async function setRole(id: string, role: Account['role']) {
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role })
      });
      if (!res.ok) throw new Error();
      toast.success('Роль обновлена');
      load();
    } catch {
      toast.error('Ошибка при изменении роли');
    }
  }

  async function confirmResetPassword() {
    if (!resetTarget) return;
    if (newPassword.length < 8) {
      toast.error('Пароль должен быть не короче 8 символов');
      return;
    }
    try {
      setResetting(true);
      const res = await fetch('/api/admin/accounts/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resetTarget.id, newPassword })
      });
      if (!res.ok) throw new Error();
      toast.success('Пароль обновлён');
      setResetTarget(null);
      setNewPassword('');
    } catch {
      toast.error('Ошибка при сбросе пароля');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className='flex flex-1 flex-col space-y-6 px-6 py-6'>
      <div className='flex items-center justify-between'>
        <Heading
          title='Аккаунты администраторов'
          description='Управление ролями, статусом и паролями администраторов'
        />
      </div>

      <Separator className='my-4' />

      <div className='glass-card rounded-md border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50'>
        <div className='text-muted-foreground grid grid-cols-4 gap-2 border-b p-3 text-sm font-medium'>
          <div>Email</div>
          <div>Роль</div>
          <div>Статус</div>
          <div>Действия</div>
        </div>

        {loading ? (
          <div className='space-y-2 p-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-10 w-full' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className='text-muted-foreground flex h-[200px] items-center justify-center text-sm'>
            Нет аккаунтов администраторов
          </div>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className='grid grid-cols-4 items-center gap-2 border-b p-3 text-sm last:border-b-0'
            >
              <div className='truncate'>{a.email}</div>
              <div>
                <Select
                  value={a.role}
                  onValueChange={(v) => setRole(a.id, v as Account['role'])}
                >
                  <SelectTrigger className='w-[160px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='SUPERADMIN'>SUPERADMIN</SelectItem>
                    <SelectItem value='ADMIN'>ADMIN</SelectItem>
                    <SelectItem value='MANAGER'>MANAGER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button
                  variant={a.isActive ? 'secondary' : 'default'}
                  size='sm'
                  onClick={() => setActive(a.id, !a.isActive)}
                >
                  {a.isActive ? 'Активен' : 'Заблокирован'}
                </Button>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    setResetTarget(a);
                    setNewPassword('');
                  }}
                >
                  Сбросить пароль
                </Button>
                <Button size='sm' onClick={() => setActive(a.id, !a.isActive)}>
                  {a.isActive ? 'Заблокировать' : 'Разблокировать'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Диалог сброса пароля */}
      <Dialog
        open={!!resetTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null);
            setNewPassword('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сброс пароля</DialogTitle>
            <DialogDescription>
              {resetTarget
                ? `Новый пароль для ${resetTarget.email}`
                : 'Новый пароль'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='new-password'>Новый пароль</Label>
            <Input
              id='new-password'
              type='password'
              autoComplete='new-password'
              placeholder='Минимум 8 символов'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmResetPassword();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setResetTarget(null);
                setNewPassword('');
              }}
              disabled={resetting}
            >
              Отмена
            </Button>
            <Button onClick={confirmResetPassword} disabled={resetting}>
              {resetting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
