import { TicketStatus, TicketPriority } from '@/types/ticket';

export const STATUS_OPTIONS = [
  { label: 'Open', value: 'open' as TicketStatus },
  { label: 'In Progress', value: 'in_progress' as TicketStatus },
  { label: 'Resolved', value: 'resolved' as TicketStatus },
  { label: 'Closed', value: 'closed' as TicketStatus }
];

export const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' as TicketPriority },
  { label: 'Medium', value: 'medium' as TicketPriority },
  { label: 'High', value: 'high' as TicketPriority },
  { label: 'Urgent', value: 'urgent' as TicketPriority }
];

export type SupportTicketCategory =
  | '帳戶/錢包'
  | '用戶檢舉和處罰'
  | '業務資訊'
  | '回饋和建議'
  | '其他';
export const CATEGORY_OPTIONS: {
  label: SupportTicketCategory;
  value: SupportTicketCategory;
}[] = [
  { label: '帳戶/錢包', value: '帳戶/錢包' },
  { label: '用戶檢舉和處罰', value: '用戶檢舉和處罰' },
  { label: '業務資訊', value: '業務資訊' },
  { label: '回饋和建議', value: '回饋和建議' },
  { label: '其他', value: '其他' }
];
