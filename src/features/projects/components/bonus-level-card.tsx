/**
 * @file: src/features/projects/components/bonus-level-card.tsx
 * @description: Карточка уровня бонусов с drag&drop функциональностью
 * @project: SaaS Bonus System
 * @dependencies: React, DnD Kit, Shadcn/ui
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import {
  GripVertical,
  Edit,
  Trash2,
  Infinity,
  Percent,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BonusLevel } from '@/types/bonus';

interface BonusLevelCardProps {
  level: BonusLevel;
  index: number;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function BonusLevelCard({
  level,
  index,
  isLast,
  onEdit,
  onDelete,
  disabled
}: BonusLevelCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: level.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRangeText = () => {
    if (level.maxAmount === null) {
      return `от ${formatAmount(level.minAmount)}`;
    }
    if (level.minAmount === 0) {
      return `до ${formatAmount(level.maxAmount!)}`;
    }
    return `${formatAmount(level.minAmount)} - ${formatAmount(level.maxAmount!)}`;
  };

  const getLevelColor = (index: number) => {
    const colors = [
      'bg-blue-50 border-blue-200 text-blue-900',
      'bg-gray-50 border-gray-300 text-gray-900',
      'bg-yellow-50 border-yellow-300 text-yellow-900',
      'bg-purple-50 border-purple-200 text-purple-900',
      'bg-green-50 border-green-200 text-green-900'
    ];
    return colors[index % colors.length] || colors[0];
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50' : ''} ${disabled ? 'pointer-events-none' : ''} transition-all`}
    >
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          {/* Drag handle */}
          <div
            className='cursor-grab active:cursor-grabbing'
            {...attributes}
            {...listeners}
          >
            <GripVertical className='h-5 w-5 text-gray-400' />
          </div>

          {/* Level info */}
          <div className='mx-4 flex-1'>
            <div className='mb-2 flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <Badge className={getLevelColor(index)}>{index + 1}</Badge>
                <h3 className='text-lg font-semibold'>{level.name}</h3>
              </div>
              <div className='flex items-center space-x-2'>
                <Badge variant='outline' className='text-green-600'>
                  <Percent className='mr-1 h-3 w-3' />
                  {level.bonusPercent}%
                </Badge>
                <Badge variant='outline' className='text-purple-600'>
                  <CreditCard className='mr-1 h-3 w-3' />
                  {level.paymentPercent}%
                </Badge>
              </div>
            </div>

            <div className='flex items-center justify-between text-sm text-gray-600'>
              <div className='flex items-center space-x-2'>
                <span>Сумма покупок:</span>
                <span className='font-medium'>{getRangeText()}</span>
                {!isLast && (
                  <>
                    <ArrowRight className='h-3 w-3 text-gray-400' />
                    <span className='text-xs text-gray-500'>
                      следующий уровень
                    </span>
                  </>
                )}
                {isLast && level.maxAmount === null && (
                  <>
                    <Infinity className='h-3 w-3 text-gray-400' />
                    <span className='text-xs text-gray-500'>максимальный</span>
                  </>
                )}
              </div>
            </div>

            <div className='mt-2 text-xs text-gray-500'>
              Начисляется {level.bonusPercent}% бонусов • Можно оплатить до{' '}
              {level.paymentPercent}% заказа
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center space-x-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={onEdit}
              disabled={disabled}
            >
              <Edit className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={onDelete}
              disabled={disabled}
              className='text-red-600 hover:bg-red-50 hover:text-red-700'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
