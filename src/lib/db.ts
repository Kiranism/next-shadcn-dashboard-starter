import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// 调试输出
console.log('数据库URL是否存在:', !!process.env.DATABASE_URL);

// 使用环境变量中的数据库连接字符串
const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : neon(
      'postgres://neondb_owner:npg_rVT4Ovf1Xsck@ep-small-cloud-a1xq164q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    ); // 提供备用连接字符串

export const db = drizzle(sql);

// 查询用户的辅助函数
export async function getUserByUsername(username: string) {
  try {
    const [user] = await sql`SELECT * FROM users WHERE username = ${username}`;
    console.log('查询到的用户:', user); // 调试信息
    return user;
  } catch (error) {
    console.error('查询用户失败:', error);
    return null;
  }
}

export async function createUser(data: {
  username: string;
  password: string;
  name?: string;
}) {
  try {
    const [user] = await sql`
          INSERT INTO users (username, password, name)
          VALUES (${data.username}, ${data.password}, ${data.name || null})
          RETURNING *
        `;
    return user;
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}
