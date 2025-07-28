/**
 * @file: src/features/bonuses/components/user-create-dialog.tsx
 * @description: Диалог создания нового пользователя
 * @project: SaaS Bonus System
 * @dependencies: React, form handling, UI components
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
import { User, Mail, Phone, Calendar } from 'lucide-react';

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: any) => void;
  projectId: string;
}

export function UserCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  projectId
}: UserCreateDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email && !formData.phone) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо указать email или телефон',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // API вызов для создания пользователя
      const response = await fetch(`/api/projects/${projectId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          birthDate: formData.birthDate
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка создания пользователя');
      }

      const newUser = await response.json();

      // Форматируем пользователя для совместимости с UI
      const formattedUser = {
        id: newUser.id,
        name:
          `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() ||
          'Без имени',
        email: newUser.email,
        phone: newUser.phone,
        bonusBalance: 0,
        totalEarned: 0,
        createdAt: new Date(newUser.registeredAt),
        updatedAt: new Date(newUser.updatedAt),
        avatar: `https://api.slingacademy.com/public/sample-users/${Math.floor(Math.random() * 10) + 1}.png`
      };

      onSuccess(formattedUser);
      onOpenChange(false);

      // Сброс формы
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: ''
      });

      toast({
        title: 'Успех',
        description: 'Пользователь успешно добавлен'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description:
          error instanceof Error
            ? error.message
            : 'Не удалось добавить пользователя',
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
          <DialogTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Добавить пользователя
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о новом пользователе. Email или телефон
            обязательны.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='firstName'>Имя</Label>
              <Input
                id='firstName'
                placeholder='Иван'
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='lastName'>Фамилия</Label>
              <Input
                id='lastName'
                placeholder='Петров'
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email' className='flex items-center gap-2'>
              <Mail className='h-4 w-4' />
              Email
            </Label>
            <Input
              id='email'
              type='email'
              placeholder='ivan.petrov@example.com'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone' className='flex items-center gap-2'>
              <Phone className='h-4 w-4' />
              Телефон
            </Label>
            <Input
              id='phone'
              type='tel'
              placeholder='+7 (999) 123-45-67'
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='birthDate' className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              Дата рождения (необязательно)
            </Label>
            <Input
              id='birthDate'
              type='date'
              value={formData.birthDate}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (!formData.email && !formData.phone)}
          >
            {loading ? 'Добавление...' : 'Добавить пользователя'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
