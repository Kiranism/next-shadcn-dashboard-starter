//定义认证配置
import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import { getUserByUsername } from './db';
import bcrypt from 'bcryptjs';

const authConfig = {
  providers: [
    //github登录和邮箱登录
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET
    }),
    CredentialProvider({
      credentials: {
        username: { type: 'username' },
        password: { type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // 从数据库查询用户
          const user = await getUserByUsername(credentials.username as string);

          // 用户不存在
          if (!user) {
            // console.log('用户不存在:', credentials.username);
            return null;
          }

          // console.log('数据库用户:', user); // 调试信息，检查结构

          // 验证密码
          let passwordMatch = false;
          // 检测是否为明文密码
          if (user.password === credentials.password) {
            // 明文密码直接比较
            passwordMatch = true;
            // console.log('使用明文密码比较成功');
          } else {
            // 尝试使用bcrypt比较
            try {
              passwordMatch = await bcrypt.compare(
                credentials.password as string,
                user.password
              );
            } catch (error) {
              // console.error('bcrypt比较错误:', error);
            }
          }

          // console.log('密码比较结果:', passwordMatch);

          // 密码不匹配
          if (!passwordMatch) {
            // console.log('密码不匹配');
            return null;
          }

          // 返回不包含密码的用户信息
          return {
            id: String(user.id), // 确保是字符串
            name: user.name || credentials.username, // 提供备用
            email: user.email || `${credentials.username}@example.com`, // NextAuth需要email
            image: user.image,
            username: user.username
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/' //登录页面
  },
  callbacks: {
    async session({ session, token }) {
      // 确保session包含用户ID
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;

export default authConfig;
