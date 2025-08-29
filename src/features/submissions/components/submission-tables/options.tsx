import { SubmissionReviewStatus } from '@/types/submission';

export const REVIEW_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' as SubmissionReviewStatus },
  { label: 'Approved', value: 'approved' as SubmissionReviewStatus },
  { label: 'Rejected', value: 'rejected' as SubmissionReviewStatus }
];
