import { TaskStatus } from '@/types/task';

export const STATUS_OPTIONS = [
  { label: 'Draft', value: TaskStatus.DRAFT },
  { label: 'Published', value: TaskStatus.PUBLISHED },
  { label: 'Active', value: TaskStatus.ACTIVE },
  { label: 'Ended', value: TaskStatus.ENDED },
  { label: 'Cancelled', value: TaskStatus.CANCELLED }
];
