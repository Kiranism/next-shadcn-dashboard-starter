import { z } from 'zod';

// Ticket status schema
export const ticketStatusSchema = z.enum([
  'open',
  'in_progress',
  'resolved',
  'closed'
]);

// Ticket priority schema
export const ticketPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// Create ticket schema
export const createTicketSchema = z.object({
  submitterId: z.string().min(1, 'Submitter ID is required'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters'),
  priority: ticketPrioritySchema,
  tags: z
    .array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  assignedTo: z.string().optional(),
  // New fields
  email: z.string().email('Invalid email format').optional(),
  nickname: z
    .string()
    .max(100, 'Nickname must be less than 100 characters')
    .optional(),
  walletAddress: z
    .string()
    .max(255, 'Wallet address must be less than 255 characters')
    .optional(),
  subject: z
    .string()
    .max(500, 'Subject must be less than 500 characters')
    .optional(),
  category: z
    .string()
    .max(100, 'Category must be less than 100 characters')
    .optional()
});

// Update ticket status schema
export const updateTicketStatusSchema = z.object({
  status: ticketStatusSchema,
  solution: z
    .string()
    .max(2000, 'Solution must be less than 2000 characters')
    .optional(),
  assignedTo: z.string().optional()
});

// Update ticket schema
export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters')
    .optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  tags: z
    .array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  solution: z
    .string()
    .max(2000, 'Solution must be less than 2000 characters')
    .optional(),
  assignedTo: z.string().optional(),
  // New fields
  email: z.string().email('Invalid email format').optional(),
  nickname: z
    .string()
    .max(100, 'Nickname must be less than 100 characters')
    .optional(),
  walletAddress: z
    .string()
    .max(255, 'Wallet address must be less than 255 characters')
    .optional(),
  subject: z
    .string()
    .max(500, 'Subject must be less than 500 characters')
    .optional(),
  category: z
    .string()
    .max(100, 'Category must be less than 100 characters')
    .optional()
});

// Ticket search schema
export const ticketSearchSchema = z.object({
  searchTerm: z.string().optional(),
  status: z.union([ticketStatusSchema, z.array(ticketStatusSchema)]).optional(),
  priority: z
    .union([ticketPrioritySchema, z.array(ticketPrioritySchema)])
    .optional(),
  assignedTo: z.union([z.string(), z.array(z.string())]).optional(),
  submitterId: z.union([z.string(), z.array(z.string())]).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  dateRange: z
    .object({
      startDate: z.date().optional(),
      endDate: z.date().optional()
    })
    .optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'priority', 'status']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional()
});

// Ticket ID schema
export const ticketIdSchema = z.string().min(1, 'Ticket ID is required');

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TicketSearchInput = z.infer<typeof ticketSearchSchema>;
