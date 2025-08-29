// Database adapter to replace mock API calls with real database calls
import { getTasks as getTasksFromDB } from '@/lib/services/task-db-service';
import { getTickets as getTicketsFromDB } from '@/lib/services/ticket-db-service';
import { getSubmissions as getSubmissionsFromDB } from '@/lib/services/submission-db-service';
import { Task } from '@/types/task';
import { Ticket } from '@/types/ticket';
import { TaskSubmission } from '@/types/submission';

// Task database adapter
export const taskAdapter = {
  // Get tasks with pagination and filtering
  async getTasks(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
    projectName?: string;
  }): Promise<{ tasks: Task[]; total_tasks: number }> {
    try {
      return await getTasksFromDB(params);
    } catch (error) {
      console.error('Database adapter error (tasks):', error);
      // Fallback to empty result
      return { tasks: [], total_tasks: 0 };
    }
  },

  // Get task by ID
  async getTaskById(id: string): Promise<Task | null> {
    try {
      const { getTaskById } = await import('@/lib/services/task-db-service');
      return await getTaskById(id);
    } catch (error) {
      console.error('Database adapter error (task by id):', error);
      return null;
    }
  }
};

// Ticket database adapter
export const ticketAdapter = {
  // Get tickets with pagination and filtering
  async getTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
    submitter?: string;
    assignedTo?: string;
    tags?: string;
  }): Promise<{ tickets: Ticket[]; total_tickets: number }> {
    try {
      return await getTicketsFromDB(params);
    } catch (error) {
      console.error('Database adapter error (tickets):', error);
      // Fallback to empty result
      return { tickets: [], total_tickets: 0 };
    }
  },

  // Get ticket by ID
  async getTicketById(id: string): Promise<Ticket | null> {
    try {
      const { getTicketById } = await import(
        '@/lib/services/ticket-db-service'
      );
      return await getTicketById(id);
    } catch (error) {
      console.error('Database adapter error (ticket by id):', error);
      return null;
    }
  }
};

// Submission database adapter
export const submissionAdapter = {
  // Get submissions with pagination and filtering
  async getSubmissions(params: {
    page?: number;
    limit?: number;
    reviewStatus?: string;
    taskId?: string;
    userId?: string;
    reviewedBy?: string;
    search?: string;
  }): Promise<{ submissions: TaskSubmission[]; total_submissions: number }> {
    try {
      return await getSubmissionsFromDB(params);
    } catch (error) {
      console.error('Database adapter error (submissions):', error);
      // Fallback to empty result
      return { submissions: [], total_submissions: 0 };
    }
  },

  // Get submission by ID
  async getSubmissionById(id: string): Promise<TaskSubmission | null> {
    try {
      const { getSubmissionById } = await import(
        '@/lib/services/submission-db-service'
      );
      return await getSubmissionById(id);
    } catch (error) {
      console.error('Database adapter error (submission by id):', error);
      return null;
    }
  }
};
