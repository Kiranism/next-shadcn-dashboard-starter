import { db } from '../database';
import type { Ticket, TicketStatus, TicketPriority } from '@/types/ticket';
import type {
  CreateTicketInput,
  UpdateTicketInput,
  UpdateTicketStatusInput
} from '@/lib/validations/ticket';

// 数据库行到Ticket对象的转换
const mapRowToTicket = (row: any): Ticket => ({
  id: row.id.toString(),
  submitterId: row.submitter_id,
  title: row.title,
  content: row.content,
  solution: row.solution,
  status: row.status as TicketStatus,
  priority: row.priority as TicketPriority,
  tags: row.tags
    ? Array.isArray(row.tags)
      ? row.tags
      : JSON.parse(row.tags)
    : [],
  assignedTo: row.assigned_to,
  // New fields
  email: row.email,
  nickname: row.nickname,
  walletAddress: row.wallet_address,
  subject: row.subject,
  category: row.category,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

// 获取所有票据
export const getAllTickets = async (): Promise<Ticket[]> => {
  try {
    const result = await db`
      SELECT * FROM support_tickets ORDER BY created_at DESC
    `;
    return result.map(mapRowToTicket);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw new Error('Failed to fetch tickets');
  }
};

// 根据ID获取票据
export const getTicketById = async (id: string): Promise<Ticket | null> => {
  try {
    const result = await db`
      SELECT * FROM support_tickets WHERE id = ${parseInt(id)}
    `;

    if (result.length === 0) {
      return null;
    }

    return mapRowToTicket(result[0]);
  } catch (error) {
    console.error('Error fetching ticket by id:', error);
    throw new Error('Failed to fetch ticket');
  }
};

// 分页和筛选获取票据
export const getTickets = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  submitter?: string;
  assignedTo?: string;
  tags?: string;
  category?: string;
  email?: string;
}): Promise<{ tickets: Ticket[]; total_tickets: number }> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      submitter,
      assignedTo,
      tags,
      category,
      email
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

    if (submitter) {
      conditions.push(`submitter_id ILIKE $${paramIndex++}`);
      values.push(`%${submitter}%`);
    }

    if (assignedTo) {
      conditions.push(`assigned_to ILIKE $${paramIndex++}`);
      values.push(`%${assignedTo}%`);
    }

    if (tags) {
      conditions.push(`tags::text ILIKE $${paramIndex++}`);
      values.push(`%${tags}%`);
    }

    if (category) {
      conditions.push(`category ILIKE $${paramIndex++}`);
      values.push(`%${category}%`);
    }

    if (email) {
      conditions.push(`email ILIKE $${paramIndex++}`);
      values.push(`%${email}%`);
    }

    if (search) {
      conditions.push(
        `(title ILIKE $${paramIndex++} OR content ILIKE $${paramIndex++} OR subject ILIKE $${paramIndex++})`
      );
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countQuery = `SELECT COUNT(*) as count FROM support_tickets ${whereClause}`;
    const countResult = await db.unsafe(countQuery, values);
    const total_tickets = parseInt(countResult[0].count);

    // 获取分页数据
    values.push(limit, offset);
    const dataQuery = `
      SELECT * FROM support_tickets 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const result = await db.unsafe(dataQuery, values);
    const tickets = result.map(mapRowToTicket);

    return { tickets, total_tickets };
  } catch (error) {
    console.error('Error fetching tickets with pagination:', error);
    throw new Error('Failed to fetch tickets');
  }
};

// 更新ticket基本信息
export const updateTicket = async (
  ticketId: string,
  updateData: UpdateTicketInput
): Promise<Ticket | null> => {
  try {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.title !== undefined) {
      setParts.push(`title = $${paramIndex++}`);
      values.push(updateData.title);
    }

    if (updateData.content !== undefined) {
      setParts.push(`content = $${paramIndex++}`);
      values.push(updateData.content);
    }

    if (updateData.status !== undefined) {
      setParts.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }

    if (updateData.priority !== undefined) {
      setParts.push(`priority = $${paramIndex++}`);
      values.push(updateData.priority);
    }

    if (updateData.tags !== undefined) {
      setParts.push(`tags = $${paramIndex++}`);
      values.push(updateData.tags ? JSON.stringify(updateData.tags) : null);
    }

    if (updateData.assignedTo !== undefined) {
      setParts.push(`assigned_to = $${paramIndex++}`);
      values.push(updateData.assignedTo);
    }

    if (updateData.solution !== undefined) {
      setParts.push(`solution = $${paramIndex++}`);
      values.push(updateData.solution);
    }

    if (setParts.length === 0) {
      throw new Error('No fields to update');
    }

    // Add ticket ID for WHERE clause
    values.push(parseInt(ticketId));
    const whereIndex = paramIndex++;

    const query = `
      UPDATE support_tickets 
      SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${whereIndex} 
      RETURNING *
    `;

    const result = await db.unsafe(query, values);

    if (result.length === 0) {
      return null;
    }

    return mapRowToTicket(result[0]);
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw new Error('Failed to update ticket');
  }
};

// 更新票据状态
export const updateTicketStatus = async (
  ticketId: string,
  status: TicketStatus,
  solution?: string
): Promise<Ticket | null> => {
  try {
    const updateFields: any = {
      status,
      updated_at: new Date()
    };

    if (solution !== undefined) {
      updateFields.solution = solution;
    }

    const result = await db`
      UPDATE support_tickets 
      SET ${db(updateFields)}
      WHERE id = ${parseInt(ticketId)}
      RETURNING *
    `;

    if (result.length === 0) {
      return null;
    }

    return mapRowToTicket(result[0]);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw new Error('Failed to update ticket status');
  }
};

// 删除票据
export const deleteTicket = async (ticketId: string): Promise<boolean> => {
  try {
    const result = await db`
      DELETE FROM support_tickets WHERE id = ${parseInt(ticketId)}
    `;

    return result.count > 0;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw new Error('Failed to delete ticket');
  }
};

// 获取票据统计信息
export const getTicketStats = async () => {
  try {
    const statusResult = await db`
      SELECT 
        status,
        COUNT(*) as count
      FROM support_tickets 
      GROUP BY status
    `;

    const priorityResult = await db`
      SELECT 
        priority,
        COUNT(*) as count
      FROM support_tickets 
      GROUP BY priority
    `;

    const stats = {
      total: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      by_priority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      }
    };

    statusResult.forEach((row: any) => {
      const status = row.status as keyof typeof stats;
      const count = parseInt(row.count);
      if (status === 'open') {
        stats.open = count;
      } else if (status === 'in_progress') {
        stats.in_progress = count;
      } else if (status === 'resolved') {
        stats.resolved = count;
      } else if (status === 'closed') {
        stats.closed = count;
      }
      stats.total += count;
    });

    priorityResult.forEach((row: any) => {
      const priority = row.priority as keyof typeof stats.by_priority;
      if (priority in stats.by_priority) {
        stats.by_priority[priority] = parseInt(row.count);
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    throw new Error('Failed to fetch ticket statistics');
  }
};
