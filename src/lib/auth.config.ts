import { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// 定义凭证类型
interface Credentials {
  username: string
  password: string
}

// 定义会话用户类型
interface SessionUser {
  id: string
  username: string
  image: string | null
  isAdmin: boolean
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: { 
          label: 'Username',
          type: 'text',
          placeholder: 'Enter your username'
        },
        password: { 
          label: 'Password',
          type: 'password',
          placeholder: 'Enter your password'
        }
      },
      async authorize(credentials): Promise<SessionUser | null> {
        try {
          // 验证输入
          if (!credentials?.username || !credentials?.password) {
            console.error('Missing credentials');
            return null;
          }

          // 查找用户
          const user = await prisma.user.findUnique({
            where: {
              username: credentials.username
            },
            select: {
              id: true,
              username: true,
              password: true,
              image: true,
              isAdmin: true
            }
          });

          if (!user || !user.password) {
            console.error('User not found');
            return null;
          }

          // 验证密码
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.error('Invalid password');
            return null;
          }

          // 返回用户信息（不包含密码）
          return {
            id: user.id,
            username: user.username,
            image: user.image,
            isAdmin: user.isAdmin
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.image = user.image;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.id,
          username: token.username,
          image: token.image,
          isAdmin: token.isAdmin
        }
      };
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // 重定向到登录页
      } else if (isLoggedIn) {
        return true;
      }
      return true;
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.AUTH_SECRET || 'your-secret-key',
  trustHost: true
} satisfies NextAuthConfig

export default authConfig
