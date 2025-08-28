import { db } from '../database';
import type { Task, TaskStatus } from '@/types/task';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/validations/task';

// 数据库行到Task对象的转换
const mapRowToTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  startTime: row.start_time ? new Date(row.start_time) : undefined,
  deadline: new Date(row.deadline),
  rewardInstruction: row.reward_instruction || undefined,
  totalRewardAmount: parseFloat(row.total_reward_amount) || 0,
  rewardExp: parseInt(row.reward_exp) || 0,
  status: row.status as TaskStatus,
  maxParticipants: row.max_participants || undefined,
  currentParticipants: parseInt(row.current_participants) || 0,
  projectName: row.project_name || undefined,
  projectLogo: row.project_logo || undefined,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

// 获取所有任务
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const result = await db`
      SELECT * FROM tasks ORDER BY created_at DESC
    `;
    return result.map(mapRowToTask);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
};

// 根据ID获取任务
export const getTaskById = async (id: string): Promise<Task | null> => {
  try {
    const result = await db`
      SELECT * FROM tasks WHERE id = ${id}
    `;

    if (result.length === 0) {
      return null;
    }

    return mapRowToTask(result[0]);
  } catch (error) {
    console.error('Error fetching task by id:', error);
    throw new Error('Failed to fetch task');
  }
};

// 根据状态获取任务
export const getTasksByStatus = async (status: TaskStatus): Promise<Task[]> => {
  try {
    const result = await db`
      SELECT * FROM tasks WHERE status = ${status} ORDER BY created_at DESC
    `;
    return result.map(mapRowToTask);
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    throw new Error('Failed to fetch tasks by status');
  }
};

// 分页和筛选获取任务
export const getTasks = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  projectName?: string;
}): Promise<{ tasks: Task[]; total_tasks: number }> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      projectName
    } = params;
    const offset = (page - 1) * limit;

    // 构建WHERE条件
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (priority) {
      conditions.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }

    if (projectName) {
      conditions.push(`project_name ILIKE $${paramIndex++}`);
      values.push(`%${projectName}%`);
    }

    if (search) {
      conditions.push(
        `(title ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})`
      );
      values.push(`%${search}%`, `%${search}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countQuery = `SELECT COUNT(*) as count FROM tasks ${whereClause}`;
    const countResult = await db.unsafe(countQuery, values);
    const total_tasks = parseInt(countResult[0].count);

    // 获取分页数据
    values.push(limit, offset);
    const dataQuery = `
      SELECT * FROM tasks 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const result = await db.unsafe(dataQuery, values);
    const tasks = result.map(mapRowToTask);

    return { tasks, total_tasks };
  } catch (error) {
    console.error('Error fetching tasks with pagination:', error);
    throw new Error('Failed to fetch tasks');
  }
};

// 创建新任务
export const createTask = async (
  taskData: CreateTaskInput,
  createdBy: string = '当前用户'
): Promise<Task> => {
  try {
    const result = await db`
      INSERT INTO tasks (
        title, description, start_time, deadline, reward_instruction, 
        total_reward_amount, reward_exp, max_participants, current_participants,
        project_name, project_logo, created_by, status
      ) VALUES (
        ${taskData.title}, 
        ${taskData.description || null}, 
        ${taskData.startTime || null}, 
        ${taskData.deadline}, 
        ${taskData.rewardInstruction || null}, 
        ${taskData.totalRewardAmount || 0}, 
        ${taskData.rewardExp || 0}, 
        ${taskData.maxParticipants || null}, 
        0, 
        ${taskData.projectName || null}, 
        ${taskData.projectLogo || null}, 
        ${createdBy}, 
        'draft'
      ) 
      RETURNING *
    `;

    return mapRowToTask(result[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }
};

// 更新任务基本信息
export const updateTask = async (
  taskId: string,
  updateData: UpdateTaskInput
): Promise<Task | null> => {
  try {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.title !== undefined) {
      setParts.push(`title = $${paramIndex++}`);
      values.push(updateData.title);
    }

    if (updateData.description !== undefined) {
      setParts.push(`description = $${paramIndex++}`);
      values.push(updateData.description);
    }

    if (updateData.startTime !== undefined) {
      setParts.push(`start_time = $${paramIndex++}`);
      values.push(updateData.startTime);
    }

    if (updateData.deadline !== undefined) {
      setParts.push(`deadline = $${paramIndex++}`);
      values.push(updateData.deadline);
    }

    if (updateData.rewardInstruction !== undefined) {
      setParts.push(`reward_instruction = $${paramIndex++}`);
      values.push(updateData.rewardInstruction);
    }

    if (updateData.totalRewardAmount !== undefined) {
      setParts.push(`total_reward_amount = $${paramIndex++}`);
      values.push(updateData.totalRewardAmount);
    }

    if (updateData.rewardExp !== undefined) {
      setParts.push(`reward_exp = $${paramIndex++}`);
      values.push(updateData.rewardExp);
    }

    if (updateData.maxParticipants !== undefined) {
      setParts.push(`max_participants = $${paramIndex++}`);
      values.push(updateData.maxParticipants);
    }

    if (updateData.projectName !== undefined) {
      setParts.push(`project_name = $${paramIndex++}`);
      values.push(updateData.projectName);
    }

    if (updateData.projectLogo !== undefined) {
      setParts.push(`project_logo = $${paramIndex++}`);
      values.push(updateData.projectLogo);
    }

    if (updateData.status !== undefined) {
      setParts.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }

    if (setParts.length === 0) {
      throw new Error('No fields to update');
    }

    // Add task ID for WHERE clause
    values.push(taskId);
    const whereIndex = paramIndex++;

    const query = `
      UPDATE tasks 
      SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${whereIndex} 
      RETURNING *
    `;

    const result = await db.unsafe(query, values);

    if (result.length === 0) {
      return null;
    }

    return mapRowToTask(result[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error('Failed to update task');
  }
};

// 更新任务状态
export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus
): Promise<Task | null> => {
  try {
    const result = await db`
      UPDATE tasks 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${taskId}
      RETURNING *
    `;

    if (result.length === 0) {
      return null;
    }

    return mapRowToTask(result[0]);
  } catch (error) {
    console.error('Error updating task status:', error);
    throw new Error('Failed to update task status');
  }
};

// 更新参与者数量
export const updateParticipantCount = async (
  taskId: string,
  increment: number = 1
): Promise<Task | null> => {
  try {
    const result = await db`
      UPDATE tasks 
      SET current_participants = current_participants + ${increment}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${taskId}
      RETURNING *
    `;

    if (result.length === 0) {
      return null;
    }

    return mapRowToTask(result[0]);
  } catch (error) {
    console.error('Error updating participant count:', error);
    throw new Error('Failed to update participant count');
  }
};

// 删除任务
export const deleteTask = async (taskId: string): Promise<boolean> => {
  try {
    const result = await db`
      DELETE FROM tasks WHERE id = ${taskId}
    `;

    return result.count > 0;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
};

// 获取任务统计信息
export const getTaskStats = async () => {
  try {
    const result = await db`
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks 
      GROUP BY status
    `;

    const stats = {
      total: 0,
      draft: 0,
      published: 0,
      active: 0,
      ended: 0,
      cancelled: 0
    };

    result.forEach((row: any) => {
      const status = row.status as keyof typeof stats;
      const count = parseInt(row.count);
      if (status in stats) {
        stats[status] = count;
        stats.total += count;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching task stats:', error);
    throw new Error('Failed to fetch task statistics');
  }
};
