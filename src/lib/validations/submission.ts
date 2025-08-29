import { z } from 'zod';

// Submission review status schema
export const submissionReviewStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected'
]);

// Review submission schema
export const reviewSubmissionSchema = z.object({
  reviewStatus: submissionReviewStatusSchema,
  reviewComment: z
    .string()
    .max(1000, 'Review comment must be less than 1000 characters')
    .optional()
});

// Submission search schema
export const submissionSearchSchema = z.object({
  searchTerm: z.string().optional(),
  reviewStatus: z
    .union([
      submissionReviewStatusSchema,
      z.array(submissionReviewStatusSchema)
    ])
    .optional(),
  taskId: z.string().optional(),
  userId: z.string().optional(),
  reviewedBy: z.string().optional(),
  dateRange: z
    .object({
      startDate: z.date().optional(),
      endDate: z.date().optional()
    })
    .optional(),
  sortBy: z.enum(['submitted_at', 'updated_at', 'review_status']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional()
});

// Submission ID schema
export const submissionIdSchema = z
  .string()
  .min(1, 'Submission ID is required');

export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;
export type SubmissionSearchInput = z.infer<typeof submissionSearchSchema>;
