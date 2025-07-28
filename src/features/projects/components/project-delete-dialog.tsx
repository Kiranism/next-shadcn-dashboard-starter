/**
 * @file: src/features/projects/components/project-delete-dialog.tsx
 * @description: Диалог подтверждения удаления проекта
 * @project: SaaS Bonus System
 * @dependencies: React, UI components
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ProjectDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConfirm: () => Promise<void>;
}

export function ProjectDeleteDialog({
  open,
  onOpenChange,
  projectName,
  onConfirm
}: ProjectDeleteDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleConfirm = async () => {
    if (confirmationText !== projectName) {
      toast({
        title: 'Ошибка',
        description:
          'Пожалуйста, введите точное название проекта для подтверждения',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
      setConfirmationText('');
      toast({
        title: 'Успех',
        description: 'Проект успешно удален'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить проект',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='text-destructive flex items-center gap-2'>
            <Trash2 className='h-5 w-5' />
            Удалить проект
          </DialogTitle>
          <DialogDescription>
            Это действие нельзя отменить. Проект и все связанные с ним данные
            будут удалены навсегда.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='bg-destructive/10 border-destructive/20 rounded-lg border p-4'>
            <div className='text-destructive flex items-center gap-2'>
              <AlertTriangle className='h-4 w-4' />
              <span className='font-medium'>Внимание!</span>
            </div>
            <p className='text-muted-foreground mt-2 text-sm'>
              При удалении проекта будут также удалены:
            </p>
            <ul className='text-muted-foreground mt-2 list-inside list-disc space-y-1 text-sm'>
              <li>Все пользователи проекта</li>
              <li>Все бонусы и транзакции</li>
              <li>Настройки Telegram бота</li>
              <li>Реферальные программы</li>
              <li>Уровни бонусов</li>
            </ul>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmation'>
              Введите название проекта для подтверждения:{' '}
              <strong>{projectName}</strong>
            </Label>
            <Input
              id='confirmation'
              placeholder='Введите название проекта'
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            variant='destructive'
            onClick={handleConfirm}
            disabled={loading || confirmationText !== projectName}
          >
            {loading ? 'Удаление...' : 'Удалить проект'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
