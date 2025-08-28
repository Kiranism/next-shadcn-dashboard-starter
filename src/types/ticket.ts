// Support ticket status type
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// Support ticket priority type
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

// Support ticket interface
export interface Ticket {
  id: string;
  submitterId: string;
  title: string;
  content: string;
  solution?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  tags?: string[] | null;
  assignedTo?: string | null;
  // New fields
  email?: string | null;
  nickname?: string | null;
  walletAddress?: string | null;
  subject?: string | null;
  category?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Create, Update and Status update ticket data types are now defined in validations/ticket.ts via zod schemas

// Support ticket statistics
export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

// Support ticket search parameters
export interface TicketSearchParams {
  // Keyword search (search title, content, submitter ID)
  searchTerm?: string;
  // Status filter
  status?: TicketStatus | TicketStatus[];
  // Priority filter
  priority?: TicketPriority | TicketPriority[];
  // Assignee filter
  assignedTo?: string | string[];
  // Submitter filter
  submitterId?: string | string[];
  // Tags filter
  tags?: string | string[];
  // Date range filter
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
  // Sort options
  sortBy?: 'created_at' | 'updated_at' | 'priority' | 'status';
  sortOrder?: 'ASC' | 'DESC';
  // Pagination parameters
  limit?: number;
  offset?: number;
}
