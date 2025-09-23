/**
 * @file: src/features/projects/components/project-create-dialog.tsx
 * @description: Диалог создания нового проекта
 * @project: SaaS Bonus System
 * @dependencies: React Hook Form, Zod, Shadcn/ui
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

// Схема валидации
const projectSchema = z.object({
  name: z.string().min(1, 'Название проекта обязательно').max(100, 'Слишком длинное название'),
  domain: z.string().min(1, 'Домен обязателен').max(255, 'Слишком длинный домен'),
  bonusPercentage: z.number().min(0, 'Процент не может быть отрицательным').max(100, 'Максимум 100%').default(1.0),
  bonusExpiryDays: z.number().min(1, 'Минимум 1 день').max(3650, 'Максимум 10 лет').default(365),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: ProjectCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      domain: '',
      bonusPercentage: 1.0,
      bonusExpiryDays: 365,
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка создания проекта');
      }

      // Успешное создание
      form.reset();
      onSuccess();
    } catch (error) {
      // TODO: логгер
      // console.error('Ошибка создания проекта:', error);
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Произошла ошибка',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      onOpenChange(open);
      if (!open) {
        form.reset();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создать новый проект</DialogTitle>
          <DialogDescription>
            Создайте новый проект для управления бонусной программой
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название проекта *</FormLabel>
                  <FormControl>
                    <Input placeholder="Мой интернет-магазин" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Домен сайта *</FormLabel>
                  <FormControl>
                    <Input placeholder="myshop.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Домен вашего сайта для интеграции
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bonusPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Процент бонусов</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>%</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bonusExpiryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Срок действия</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="3650"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 365)}
                      />
                    </FormControl>
                    <FormDescription>дней</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать проект
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 