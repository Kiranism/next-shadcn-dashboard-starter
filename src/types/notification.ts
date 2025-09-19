/**
 * @file: notification.ts
 * @description: Типы для системы уведомлений
 * @project: Gupil.ru - SaaS Bonus System
 * @dependencies: @/types
 * @created: 2024-09-11
 * @author: AI Assistant + User
 */

export enum NotificationType {
  BONUS_EARNED = 'bonus_earned',
  BONUS_SPENT = 'bonus_spent',
  REFERRAL_BONUS = 'referral_bonus',
  WELCOME_BONUS = 'welcome_bonus',
  LEVEL_UP = 'level_up',
  PURCHASE_COMPLETED = 'purchase_completed',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  PROMOTION = 'promotion'
}

export enum NotificationChannel {
  TELEGRAM = 'telegram',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  DISMISSED = 'dismissed'
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  variables: string[]; // Переменные для подстановки: {{userName}}, {{bonusAmount}}, etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  projectId: string;
  userId?: string; // Если null, то глобальные настройки проекта
  channels: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [key in NotificationChannel]: boolean;
  };
  types: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [key in NotificationType]: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
  };
  frequency: {
    maxPerDay: number;
    maxPerHour: number;
  };
}

export interface NotificationLog {
  id: string;
  projectId: string;
  userId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  priority: NotificationPriority;
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface NotificationPayload {
  projectId: string;
  userId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  priority?: NotificationPriority;
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}
