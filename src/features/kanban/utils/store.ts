import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
// import { persist } from 'zustand/middleware';

export type Priority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  description?: string;
  assignee?: string;
  dueDate?: string;
};

type KanbanState = {
  columns: Record<string, Task[]>;
  setColumns: (columns: Record<string, Task[]>) => void;
  addTask: (title: string, description?: string) => void;
};

const initialColumns: Record<string, Task[]> = {
  backlog: [
    {
      id: '1',
      title: 'Migrate to Stripe billing API',
      priority: 'high',
      assignee: 'Sarah Chen',
      dueDate: '2026-04-08'
    },
    {
      id: '2',
      title: 'Add CSV export to reports',
      priority: 'medium',
      assignee: 'Marcus Rivera',
      dueDate: '2026-04-12'
    },
    {
      id: '3',
      title: 'Update onboarding flow copy',
      priority: 'low',
      assignee: 'Priya Sharma',
      dueDate: '2026-04-15'
    },
    {
      id: '9',
      title: 'Audit RBAC permissions',
      priority: 'medium',
      assignee: 'Jordan Kim',
      dueDate: '2026-04-10'
    }
  ],
  inProgress: [
    {
      id: '4',
      title: 'Refactor notification service',
      priority: 'high',
      assignee: 'Alex Turner',
      dueDate: '2026-04-03'
    },
    {
      id: '5',
      title: 'Build team invitation flow',
      priority: 'medium',
      assignee: 'Emily Nakamura',
      dueDate: '2026-04-06'
    },
    {
      id: '10',
      title: 'Fix timezone handling in scheduler',
      priority: 'high',
      assignee: 'Sarah Chen',
      dueDate: '2026-04-04'
    }
  ],
  done: [
    {
      id: '6',
      title: 'SSO integration with Okta',
      priority: 'high',
      assignee: 'Jordan Kim',
      dueDate: '2026-03-22'
    },
    {
      id: '7',
      title: 'Dashboard analytics charts',
      priority: 'medium',
      assignee: 'Marcus Rivera',
      dueDate: '2026-03-20'
    },
    {
      id: '8',
      title: 'Webhook retry mechanism',
      priority: 'low',
      assignee: 'Alex Turner',
      dueDate: '2026-03-18'
    }
  ]
};

export const useTaskStore = create<KanbanState>()(
  // To enable persistence across refreshes, uncomment the persist wrapper below:
  // persist(
  (set) => ({
    columns: initialColumns,

    setColumns: (columns) => set({ columns }),

    addTask: (title, description) =>
      set((state) => ({
        columns: {
          ...state.columns,
          backlog: [
            {
              id: uuid(),
              title,
              description,
              priority: 'medium' as Priority,
              assignee: undefined,
              dueDate: undefined
            },
            ...(state.columns.backlog ?? [])
          ]
        }
      }))
  })
  //   ,
  //   { name: 'kanban-store' }
  // )
);
