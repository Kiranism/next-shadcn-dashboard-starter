/**
 * @file: src/lib/services/bot-templates/templates/loyalty-with-subscription.template.ts
 * @description: Шаблон системы лояльности с обязательной подпиской на канал
 * @project: SaaS Bonus System
 * @created: 2026-03-07
 * @author: AI Assistant + User
 */

import { BotTemplate } from '../bot-templates.service';
import loyaltyWithSubscriptionWorkflow from '@/lib/workflow-templates/loyalty-with-subscription.json';

export const loyaltyWithSubscriptionTemplate: BotTemplate = {
  id: 'loyalty_with_subscription',
  name: 'Система лояльности с подпиской',
  description:
    'Полнофункциональная система лояльности с обязательной подпиской на Telegram канал. Приветственные бонусы начисляются только после подтверждения подписки. Включает проверку подписки, привязку по телефону/email, полное меню с балансом, историей, уровнями и рефералами.',
  category: 'loyalty',
  difficulty: 'advanced',
  tags: [
    'loyalty',
    'bonuses',
    'subscription',
    'channel',
    'registration',
    'contact',
    'welcome-bonus',
    'referral',
    'levels',
    'menu'
  ],
  estimatedTime: 45,
  icon: '🎁',
  color: '#8b5cf6',

  workflowConfig: {
    name: loyaltyWithSubscriptionWorkflow.name,
    description: loyaltyWithSubscriptionWorkflow.description,
    nodes: loyaltyWithSubscriptionWorkflow.nodes,
    connections: loyaltyWithSubscriptionWorkflow.connections,
    variables: loyaltyWithSubscriptionWorkflow.variables,
    settings: (loyaltyWithSubscriptionWorkflow as any).settings || {}
  },

  features: [
    '✅ Обязательная подписка на Telegram канал',
    '🎁 Приветственные бонусы после подписки',
    '📱 Привязка по телефону или email',
    '💰 Полное меню: баланс, история, уровни',
    '👥 Реферальная программа',
    '🔄 Автоматическая проверка подписки',
    '📊 Детальная статистика пользователя',
    '🏆 Система уровней лояльности'
  ],

  integrations: ['Telegram Bot API', 'Database'],

  useCases: [
    'Интернет-магазины с Telegram каналом',
    'Бренды с активным комьюнити в Telegram',
    'Компании, продвигающие свой канал',
    'Бизнес с многоуровневой программой лояльности',
    'Проекты с реферальной системой'
  ],

  installs: 0,
  rating: 0,
  reviews: 0,

  author: 'Gupil Team',
  version: '1.0.0',
  createdAt: new Date('2026-03-07'),
  updatedAt: new Date('2026-03-07'),

  isPublic: true
};
