import { db } from '../database';
import type {
  TaskSubmission,
  Profile,
  SubmissionReviewStatus,
  SubmissionStats
} from '@/types/submission';
import type { Task } from '@/types/task';
import type { ReviewSubmissionInput } from '@/lib/validations/submission';

// 数据库行到TaskSubmission对象的转换
const mapRowToSubmission = (row: any): TaskSubmission => ({
  id: row.id,
  taskId: row.task_id,
  userId: row.user_id,
  submissionContent: row.submission_content,
  reviewStatus: row.review_status as SubmissionReviewStatus,
  reviewComment: row.review_comment,
  reviewedBy: row.reviewed_by,
  reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
  submittedAt: new Date(row.submitted_at),
  updatedAt: new Date(row.updated_at),
  // Relations will be added if joined
  task: row.task_title
    ? ({
        id: row.task_id,
        title: row.task_title,
        description: row.task_description,
        deadline: new Date(row.task_deadline),
        totalRewardAmount: row.task_total_reward_amount,
        rewardExp: row.task_reward_exp,
        status: row.task_status,
        currentParticipants: row.task_current_participants,
        maxParticipants: row.task_max_participants,
        projectName: row.task_project_name,
        createdBy: row.task_created_by,
        createdAt: new Date(row.task_created_at),
        updatedAt: new Date(row.task_updated_at)
      } as Task)
    : undefined,
  profile:
    row.profile_full_name !== undefined
      ? ({
          id: row.user_id,
          fullName: row.profile_full_name,
          avatarUrl: row.profile_avatar_url,
          role: row.profile_role,
          experiencePoints: row.profile_experience_points,
          level: row.profile_level,
          walletAddress: row.profile_wallet_address,
          isPremiumMember: row.profile_is_premium_member,
          youtubeId: row.profile_youtube_id,
          youtubeTitle: row.profile_youtube_title,
          subscribers: row.profile_subscribers,
          views: row.profile_views,
          motto: row.profile_motto,
          userNumericId: row.profile_user_numeric_id,
          createdAt: new Date(row.profile_created_at),
          updatedAt: new Date(row.profile_updated_at)
        } as Profile)
      : undefined
});

// 获取所有提交作品
export const getAllSubmissions = async (): Promise<TaskSubmission[]> => {
  try {
    const result = await db`
      SELECT 
        ts.*,
        t.title as task_title,
        t.description as task_description,
        t.deadline as task_deadline,
        t.total_reward_amount as task_total_reward_amount,
        t.reward_exp as task_reward_exp,
        t.status as task_status,
        t.current_participants as task_current_participants,
        t.max_participants as task_max_participants,
        t.project_name as task_project_name,
        t.created_by as task_created_by,
        t.created_at as task_created_at,
        t.updated_at as task_updated_at,
        p.full_name as profile_full_name,
        p.avatar_url as profile_avatar_url,
        p.role as profile_role,
        p.experience_points as profile_experience_points,
        p.level as profile_level,
        p.wallet_address as profile_wallet_address,
        p.is_premium_member as profile_is_premium_member,
        p.youtube_id as profile_youtube_id,
        p.youtube_title as profile_youtube_title,
        p.subscribers as profile_subscribers,
        p.views as profile_views,
        p.motto as profile_motto,
        p.user_numeric_id as profile_user_numeric_id,
        p.created_at as profile_created_at,
        p.updated_at as profile_updated_at
      FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      LEFT JOIN profiles p ON ts.user_id = p.clerk_user_id
      ORDER BY ts.submitted_at DESC
    `;
    return result.map(mapRowToSubmission);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw new Error('Failed to fetch submissions');
  }
};

// 根据ID获取提交作品
export const getSubmissionById = async (
  id: string
): Promise<TaskSubmission | null> => {
  try {
    const result = await db`
      SELECT 
        ts.*,
        t.title as task_title,
        t.description as task_description,
        t.deadline as task_deadline,
        t.total_reward_amount as task_total_reward_amount,
        t.reward_exp as task_reward_exp,
        t.status as task_status,
        t.current_participants as task_current_participants,
        t.max_participants as task_max_participants,
        t.project_name as task_project_name,
        t.created_by as task_created_by,
        t.created_at as task_created_at,
        t.updated_at as task_updated_at,
        p.full_name as profile_full_name,
        p.avatar_url as profile_avatar_url,
        p.role as profile_role,
        p.experience_points as profile_experience_points,
        p.level as profile_level,
        p.wallet_address as profile_wallet_address,
        p.is_premium_member as profile_is_premium_member,
        p.youtube_id as profile_youtube_id,
        p.youtube_title as profile_youtube_title,
        p.subscribers as profile_subscribers,
        p.views as profile_views,
        p.motto as profile_motto,
        p.user_numeric_id as profile_user_numeric_id,
        p.created_at as profile_created_at,
        p.updated_at as profile_updated_at
      FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      LEFT JOIN profiles p ON ts.user_id = p.clerk_user_id
      WHERE ts.id = ${id}
    `;

    if (result.length === 0) {
      return null;
    }

    return mapRowToSubmission(result[0]);
  } catch (error) {
    console.error('Error fetching submission by id:', error);
    throw new Error('Failed to fetch submission');
  }
};

// 分页和筛选获取提交作品
export const getSubmissions = async (params: {
  page?: number;
  limit?: number;
  reviewStatus?: string;
  taskId?: string;
  userId?: string;
  reviewedBy?: string;
  search?: string;
}): Promise<{ submissions: TaskSubmission[]; total_submissions: number }> => {
  try {
    console.log('params', params);
    const {
      page = 1,
      limit = 10,
      reviewStatus,
      taskId,
      userId,
      reviewedBy,
      search
    } = params;
    const offset = (page - 1) * limit;

    // 构建WHERE条件
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (reviewStatus) {
      conditions.push(`ts.review_status = $${paramIndex++}`);
      values.push(reviewStatus);
    }

    if (taskId) {
      conditions.push(`ts.task_id = $${paramIndex++}`);
      values.push(taskId);
    }

    if (userId) {
      conditions.push(`ts.user_id = $${paramIndex++}`);
      values.push(userId);
    }

    if (reviewedBy) {
      conditions.push(`ts.reviewed_by = $${paramIndex++}`);
      values.push(reviewedBy);
    }

    if (search) {
      conditions.push(
        `(ts.submission_content ILIKE $${paramIndex++} OR t.title ILIKE $${paramIndex++} OR p.full_name ILIKE $${paramIndex++})`
      );
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      LEFT JOIN profiles p ON ts.user_id = p.clerk_user_id
      ${whereClause}
    `;

    const countResult = await db.unsafe(countQuery, values);
    const totalSubmissions = parseInt(countResult[0].count);

    // 获取分页数据
    const dataQuery = `
      SELECT 
        ts.*,
        t.title as task_title,
        t.description as task_description,
        t.deadline as task_deadline,
        t.total_reward_amount as task_total_reward_amount,
        t.reward_exp as task_reward_exp,
        t.status as task_status,
        t.current_participants as task_current_participants,
        t.max_participants as task_max_participants,
        t.project_name as task_project_name,
        t.created_by as task_created_by,
        t.created_at as task_created_at,
        t.updated_at as task_updated_at,
        p.full_name as profile_full_name,
        p.avatar_url as profile_avatar_url,
        p.role as profile_role,
        p.experience_points as profile_experience_points,
        p.level as profile_level,
        p.wallet_address as profile_wallet_address,
        p.is_premium_member as profile_is_premium_member,
        p.youtube_id as profile_youtube_id,
        p.youtube_title as profile_youtube_title,
        p.subscribers as profile_subscribers,
        p.views as profile_views,
        p.motto as profile_motto,
        p.user_numeric_id as profile_user_numeric_id,
        p.created_at as profile_created_at,
        p.updated_at as profile_updated_at
      FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      LEFT JOIN profiles p ON ts.user_id = p.clerk_user_id
      ${whereClause}
      ORDER BY ts.submitted_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);
    const result = await db.unsafe(dataQuery, values);
    const submissions = result.map(mapRowToSubmission);

    return {
      submissions,
      total_submissions: totalSubmissions
    };
  } catch (error) {
    console.error('Error fetching submissions with filters:', error);
    throw new Error('Failed to fetch submissions');
  }
};

// 审核提交作品
export const reviewSubmission = async (
  submissionId: string,
  reviewData: ReviewSubmissionInput,
  reviewedBy: string
): Promise<TaskSubmission | null> => {
  try {
    const result = await db`
      UPDATE task_submissions 
      SET 
        review_status = ${reviewData.reviewStatus},
        review_comment = ${reviewData.reviewComment || null},
        reviewed_by = ${reviewedBy},
        reviewed_at = ${new Date()},
        updated_at = ${new Date()}
      WHERE id = ${submissionId}
      RETURNING *
    `;

    if (result.length === 0) {
      return null;
    }

    // 获取完整的提交信息（包含关联数据）
    return await getSubmissionById(submissionId);
  } catch (error) {
    console.error('Error reviewing submission:', error);
    throw new Error('Failed to review submission');
  }
};

// 获取提交作品统计信息
export const getSubmissionStats = async (): Promise<SubmissionStats> => {
  try {
    const result = await db`
      SELECT 
        review_status,
        COUNT(*) as count
      FROM task_submissions 
      GROUP BY review_status
    `;

    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    result.forEach((row: any) => {
      const status = row.review_status as keyof typeof stats;
      const count = parseInt(row.count);
      if (status in stats) {
        stats[status] = count;
        stats.total += count;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching submission stats:', error);
    throw new Error('Failed to fetch submission statistics');
  }
};
