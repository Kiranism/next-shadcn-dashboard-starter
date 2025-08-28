import { z } from 'zod';
import { TaskStatus } from '@/types/task';

// Task status schema
export const taskStatusSchema = z.nativeEnum(TaskStatus);

// Create task schema
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  deadline: z.date().min(new Date(), 'Deadline must be in the future'),
  rewardInstruction: z
    .string()
    .max(500, 'Reward instruction must be less than 500 characters')
    .optional(),
  totalRewardAmount: z.number().min(0, 'Reward amount must be non-negative'),
  rewardExp: z
    .number()
    .int()
    .min(0, 'Reward experience must be a non-negative integer'),
  maxParticipants: z
    .number()
    .int()
    .min(1, 'Max participants must be at least 1')
    .optional(),
  projectName: z
    .string()
    .max(100, 'Project name must be less than 100 characters')
    .optional(),
  projectLogo: z.string().url('Project logo must be a valid URL').optional(),
  startTime: z.date().optional()
});

// Update task schema
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  deadline: z
    .date()
    .min(new Date(), 'Deadline must be in the future')
    .optional(),
  rewardInstruction: z
    .string()
    .max(500, 'Reward instruction must be less than 500 characters')
    .optional(),
  totalRewardAmount: z
    .number()
    .min(0, 'Reward amount must be non-negative')
    .optional(),
  rewardExp: z
    .number()
    .int()
    .min(0, 'Reward experience must be a non-negative integer')
    .optional(),
  maxParticipants: z
    .number()
    .int()
    .min(1, 'Max participants must be at least 1')
    .optional(),
  projectName: z
    .string()
    .max(100, 'Project name must be less than 100 characters')
    .optional(),
  projectLogo: z.string().url('Project logo must be a valid URL').optional(),
  startTime: z.date().optional(),
  status: taskStatusSchema.optional()
});

// Task search schema
export const taskSearchSchema = z.object({
  searchTerm: z.string().optional(),
  status: z.union([taskStatusSchema, z.array(taskStatusSchema)]).optional(),
  createdBy: z.union([z.string(), z.array(z.string())]).optional(),
  projectName: z.string().optional(),
  dateRange: z
    .object({
      startDate: z.date().optional(),
      endDate: z.date().optional()
    })
    .optional(),
  rewardRange: z
    .object({
      minAmount: z.number().min(0).optional(),
      maxAmount: z.number().min(0).optional()
    })
    .optional(),
  expRange: z
    .object({
      minExp: z.number().int().min(0).optional(),
      maxExp: z.number().int().min(0).optional()
    })
    .optional(),
  sortBy: z
    .enum(['created_at', 'updated_at', 'deadline', 'priority', 'status'])
    .optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional()
});

// Task ID schema
export const taskIdSchema = z.string().min(1, 'Task ID is required');

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskSearchInput = z.infer<typeof taskSearchSchema>;
