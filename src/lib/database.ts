import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(process.env.DATABASE_URL, {
  // SSL 配置
  ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',

  // 连接池配置
  max: 10, // 减少最大连接数
  idle_timeout: 20, // 空闲超时 (秒)
  connect_timeout: 30, // 连接超时 (秒)

  // 重连配置
  max_lifetime: 60 * 30, // 连接最大生命周期 30 分钟

  // 错误处理
  onnotice: () => {}, // 忽略 notice 消息

  // 调试配置 (开发环境)
  debug: process.env.NODE_ENV === 'development' ? false : false,

  // 转换配置
  transform: {
    undefined: null // 将 undefined 转换为 null
  },

  // 连接配置
  prepare: false // 禁用预准备语句以提高兼容性
});

// 添加连接健康检查
let isConnected = false;

const testConnection = async () => {
  try {
    await sql`SELECT 1`;
    isConnected = true;
  } catch (error) {
    isConnected = false;
    console.error('Database connection failed:', error);
  }
};

// 在首次导入时测试连接
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

// 导出连接和健康检查函数
export { sql as db, testConnection, isConnected };
