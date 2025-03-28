//初始化 nextauth 并导出函数
import NextAuth from 'next-auth';
import authConfig from './auth.config';

export const { auth, handlers, signOut, signIn } = NextAuth(authConfig);
