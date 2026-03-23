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
      title: 'Add authentication',
      priority: 'high',
      assignee: 'John Doe',
      dueDate: '2024-04-01'
    },
    {
      id: '2',
      title: 'Create API endpoints',
      priority: 'medium',
      assignee: 'Jane Smith',
      dueDate: '2024-04-05'
    },
    {
      id: '3',
      title: 'Write documentation',
      priority: 'low',
      assignee: 'Bob Johnson',
      dueDate: '2024-04-10'
    }
  ],
  inProgress: [
    {
      id: '4',
      title: 'Design system updates',
      priority: 'high',
      assignee: 'Alice Brown',
      dueDate: '2024-03-28'
    },
    {
      id: '5',
      title: 'Implement dark mode',
      priority: 'medium',
      assignee: 'Charlie Wilson',
      dueDate: '2024-04-02'
    }
  ],
  done: [
    {
      id: '7',
      title: 'Setup project',
      priority: 'high',
      assignee: 'Eve Davis',
      dueDate: '2024-03-25'
    },
    {
      id: '8',
      title: 'Initial commit',
      priority: 'low',
      assignee: 'Frank White',
      dueDate: '2024-03-24'
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
