// Database adapter to replace mock API calls with real database calls
import { getTasks as getTasksFromDB } from '@/lib/services/task-db-service';
import { getTickets as getTicketsFromDB } from '@/lib/services/ticket-db-service';
import { Task } from '@/types/task';
import { Ticket } from '@/types/ticket';

// Task database adapter that mimics the mock API interface
export const fakeTasks = {
  // Get tasks with pagination and filtering (mimics the mock API interface)
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

// Ticket database adapter that mimics the mock API interface
export const fakeTickets = {
  // Get tickets with pagination and filtering (mimics the mock API interface)
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
