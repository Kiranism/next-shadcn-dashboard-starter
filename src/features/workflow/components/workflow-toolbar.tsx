/**
 * @file: src/features/workflow/components/workflow-toolbar.tsx
 * @description: Панель инструментов для добавления нод в конструктор workflow
 * @project: SaaS Bonus System
 * @dependencies: React, shadcn/ui, lucide-react
 * @created: 2025-01-11
 * @author: AI Assistant + User
 */

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Play,
  MessageSquare,
  GitBranchPlus,
  GitMerge,
  Repeat,
  Clock,
  Flag,
  Database,
  Webhook,
  Variable,
  PhoneForwarded,
  Phone,
  Keyboard,
  Image,
  Video,
  FileText,
  Edit3,
  Trash2,
  Globe,
  Link2,
  Coins,
  BarChart3,
  User,
  Users,
  Mail,
  CalendarClock
} from 'lucide-react';
import type { WorkflowNodeType, Position } from '@/types/workflow';

interface NodeTemplate {
  type: WorkflowNodeType;
  label: string;
  icon: React.ElementType;
  color: string;
  category: ToolbarCategoryKey;
  description?: string;
}

type ToolbarCategoryKey =
  | 'triggers'
  | 'messages'
  | 'actions'
  | 'logic'
  | 'flow'
  | 'integrations';

const NODE_TEMPLATES: NodeTemplate[] = [
  // Triggers
  {
    type: 'trigger.command',
    label: 'Команда',
    icon: Play,
    color: '#15803d',
    category: 'triggers',
    description: 'Запуск по команде, например /start'
  },
  {
    type: 'trigger.message',
    label: 'Сообщение',
    icon: MessageSquare,
    color: '#2563eb',
    category: 'triggers',
    description: 'Автозапуск по тексту пользователя'
  },
  {
    type: 'trigger.callback',
    label: 'Callback',
    icon: GitBranchPlus,
    color: '#a855f7',
    category: 'triggers',
    description: 'Обработка нажатий на inline-кнопки'
  },
  {
    type: 'trigger.webhook',
    label: 'Webhook',
    icon: Webhook,
    color: '#f97316',
    category: 'triggers',
    description: 'Входящий запрос из внешней системы'
  },
  {
    type: 'trigger.schedule',
    label: 'Расписание',
    icon: CalendarClock,
    color: '#0ea5e9',
    category: 'triggers',
    description: 'Запуск по cron + фильтру (день рождения, рассылки)'
  },

  // Messages
  {
    type: 'message',
    label: 'Текстовое сообщение',
    icon: MessageSquare,
    color: '#2563eb',
    category: 'messages',
    description: 'Отправка обычного сообщения'
  },
  {
    type: 'message.keyboard.inline',
    label: 'Inline клавиатура',
    icon: Keyboard,
    color: '#7c3aed',
    category: 'messages',
    description: 'Inline-кнопки под сообщением'
  },
  {
    type: 'message.keyboard.reply',
    label: 'Reply клавиатура',
    icon: Keyboard,
    color: '#9333ea',
    category: 'messages',
    description: 'Меню с reply-кнопками'
  },
  {
    type: 'message.photo',
    label: 'Фото',
    icon: Image,
    color: '#f59e0b',
    category: 'messages',
    description: 'Сообщение с изображением'
  },
  {
    type: 'message.video',
    label: 'Видео',
    icon: Video,
    color: '#db2777',
    category: 'messages',
    description: 'Сообщение с видеороликом'
  },
  {
    type: 'message.document',
    label: 'Документ',
    icon: FileText,
    color: '#0284c7',
    category: 'messages',
    description: 'Отправка файла или документа'
  },
  {
    type: 'message.edit',
    label: 'Редактировать',
    icon: Edit3,
    color: '#6b7280',
    category: 'messages',
    description: 'Редактирование отправленного сообщения'
  },
  {
    type: 'message.delete',
    label: 'Удалить',
    icon: Trash2,
    color: '#dc2626',
    category: 'messages',
    description: 'Удаление сообщения в чате'
  },

  // Actions
  {
    type: 'action.api_request',
    label: 'API запрос',
    icon: Globe,
    color: '#2563eb',
    category: 'actions',
    description: 'HTTP запрос к внешнему сервису'
  },
  {
    type: 'action.database_query',
    label: 'База данных',
    icon: Database,
    color: '#7c3aed',
    category: 'actions',
    description: 'Выполнение безопасного запроса к БД'
  },
  {
    type: 'action.set_variable',
    label: 'Установить переменную',
    icon: Variable,
    color: '#db2777',
    category: 'actions',
    description: 'Сохранение значения в переменную'
  },
  {
    type: 'action.get_variable',
    label: 'Получить переменную',
    icon: Variable,
    color: '#22c55e',
    category: 'actions',
    description: 'Чтение значения переменной'
  },
  {
    type: 'action.request_contact',
    label: 'Запрос контакта',
    icon: Phone,
    color: '#f97316',
    category: 'actions',
    description: 'Ожидание номера телефона пользователя'
  },
  {
    type: 'action.send_notification',
    label: 'Уведомление',
    icon: Mail,
    color: '#facc15',
    category: 'actions',
    description: 'Отправка email/telegram/webhook уведомлений'
  },
  {
    type: 'action.check_user_linked',
    label: 'Проверка связи',
    icon: User,
    color: '#14b8a6',
    category: 'actions',
    description: 'Проверка привязки Telegram аккаунта'
  },
  {
    type: 'action.find_user_by_contact',
    label: 'Поиск по контакту',
    icon: PhoneForwarded,
    color: '#0891b2',
    category: 'actions',
    description: 'Поиск пользователя по телефону или email'
  },
  {
    type: 'action.link_telegram_account',
    label: 'Привязать Telegram',
    icon: Link2,
    color: '#6366f1',
    category: 'actions',
    description: 'Связка пользователя с Telegram аккаунтом'
  },
  {
    type: 'action.get_user_balance',
    label: 'Баланс пользователя',
    icon: Coins,
    color: '#f59e0b',
    category: 'actions',
    description: 'Получение текущего баланса бонусов'
  },
  {
    type: 'action.check_channel_subscription',
    label: 'Проверка подписки',
    icon: Users,
    color: '#8b5cf6',
    category: 'actions',
    description: 'Проверка подписки пользователя на Telegram канал'
  },

  // Logic & Flow
  {
    type: 'condition',
    label: 'Условие',
    icon: GitBranchPlus,
    color: '#f97316',
    category: 'logic',
    description: 'Ветвление по условию/выражению'
  },
  {
    type: 'flow.switch',
    label: 'Switch',
    icon: GitBranchPlus,
    color: '#f97316',
    category: 'logic',
    description: 'Множественный выбор ветки'
  },
  {
    type: 'flow.delay',
    label: 'Задержка',
    icon: Clock,
    color: '#facc15',
    category: 'flow',
    description: 'Пауза перед продолжением выполнения'
  },
  {
    type: 'flow.loop',
    label: 'Цикл',
    icon: Repeat,
    color: '#60a5fa',
    category: 'flow',
    description: 'Повторить действия несколько раз'
  },
  {
    type: 'flow.sub_workflow',
    label: 'Подпроцесс',
    icon: GitMerge,
    color: '#8b5cf6',
    category: 'flow',
    description: 'Запуск вложенного workflow'
  },
  {
    type: 'flow.jump',
    label: 'Переход',
    icon: GitBranchPlus,
    color: '#6366f1',
    category: 'flow',
    description: 'Переход на другую ноду'
  },
  {
    type: 'flow.end',
    label: 'Завершение',
    icon: Flag,
    color: '#6b7280',
    category: 'flow',
    description: 'Завершение исполнения'
  },

  // Integrations
  {
    type: 'integration.webhook',
    label: 'Интеграция (Webhook)',
    icon: Webhook,
    color: '#f97316',
    category: 'integrations',
    description: 'Вызов стороннего Webhook'
  },
  {
    type: 'integration.analytics',
    label: 'Интеграция (Аналитика)',
    icon: BarChart3,
    color: '#1d4ed8',
    category: 'integrations',
    description: 'Отправка событий в аналитику'
  }
];

const CATEGORY_METADATA: Record<
  ToolbarCategoryKey,
  { label: string; description: string }
> = {
  triggers: { label: 'Триггеры', description: 'Точки входа в сценарий' },
  messages: { label: 'Сообщения', description: 'Коммуникация с пользователем' },
  actions: { label: 'Действия', description: 'Работа с данными и сервисами' },
  logic: { label: 'Логика', description: 'Ветвления и switch-case' },
  flow: {
    label: 'Управление потоком',
    description: 'Циклы, задержки, подпроцессы'
  },
  integrations: {
    label: 'Интеграции',
    description: 'Связь с внешними системами'
  }
};

interface WorkflowToolbarProps {
  onAddNode: (nodeType: WorkflowNodeType, position: Position) => void;
  className?: string;
}

export function WorkflowToolbar({
  onAddNode,
  className = ''
}: WorkflowToolbarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleDragStart = useCallback(
    (event: React.DragEvent, nodeType: WorkflowNodeType) => {
      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleAddNodeClick = useCallback(
    (nodeType: WorkflowNodeType) => {
      // Добавляем ноду в случайную позицию
      onAddNode(nodeType, {
        x: Math.random() * 300 + 100,
        y: Math.random() * 300 + 100
      });
    },
    [onAddNode]
  );

  const filteredCategories = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    const categories = (
      Object.keys(CATEGORY_METADATA) as ToolbarCategoryKey[]
    ).map((categoryKey) => {
      const nodes = NODE_TEMPLATES.filter(
        (template) => template.category === categoryKey
      );
      const visibleNodes = normalized
        ? nodes.filter(
            (template) =>
              template.label.toLowerCase().includes(normalized) ||
              template.type.toLowerCase().includes(normalized) ||
              template.description?.toLowerCase().includes(normalized)
          )
        : nodes;

      return {
        key: categoryKey,
        info: CATEGORY_METADATA[categoryKey],
        nodes: visibleNodes
      };
    });

    return categories.filter((category) => category.nodes.length > 0);
  }, [searchTerm]);

  const activeAccordionItems = useMemo(
    () => filteredCategories.map((category) => category.key),
    [filteredCategories]
  );

  return (
    <TooltipProvider>
      <div
        className={`bg-background flex flex-col gap-3 rounded-md border p-3 shadow-lg ${className}`}
      >
        <div className='flex flex-shrink-0 flex-col gap-2'>
          <span className='text-muted-foreground text-xs font-medium uppercase'>
            Добавить ноду
          </span>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder='Поиск по названиям и типам...'
            className='h-9 text-sm'
          />
        </div>

        <ScrollArea className='min-h-0 flex-1 pr-2'>
          {filteredCategories.length === 0 ? (
            <div className='text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed p-6 text-center text-sm'>
              <p>Ничего не найдено. Попробуйте изменить запрос.</p>
            </div>
          ) : (
            <Accordion
              type='multiple'
              defaultValue={activeAccordionItems}
              className='space-y-2'
            >
              {filteredCategories.map(({ key, info, nodes }) => (
                <AccordionItem
                  key={key}
                  value={key}
                  className='rounded-md border px-2'
                >
                  <AccordionTrigger className='text-left text-sm font-semibold'>
                    <div className='flex flex-col text-left'>
                      <span>{info.label}</span>
                      <span className='text-muted-foreground text-xs font-normal'>
                        {info.description}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className='mt-2 grid grid-cols-1 gap-2'>
                      {nodes.map((template) => (
                        <Tooltip key={template.type}>
                          <TooltipTrigger asChild>
                            <Button
                              variant='outline'
                              className='h-auto w-full justify-start gap-3 border-dashed px-3 py-2 text-left'
                              draggable
                              onDragStart={(event) =>
                                handleDragStart(event, template.type)
                              }
                              onClick={() => handleAddNodeClick(template.type)}
                            >
                              <div
                                className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md border'
                                style={{
                                  borderColor: template.color + '80',
                                  color: template.color
                                }}
                              >
                                <template.icon className='h-5 w-5' />
                              </div>
                              <div className='flex min-w-0 flex-col text-left text-sm'>
                                <span className='truncate leading-tight font-medium'>
                                  {template.label}
                                </span>
                                <span className='text-muted-foreground truncate text-xs'>
                                  {template.type}
                                </span>
                              </div>
                            </Button>
                          </TooltipTrigger>
                          {template.description && (
                            <TooltipContent
                              side='right'
                              className='max-w-xs text-sm'
                            >
                              {template.description}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
