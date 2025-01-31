import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

// 定义管理员专属路由
const adminRoutes = ['/dashboard', '/dashboard/tasks'];
// 定义普通用户不可访问的路由
const adminOnlyRoutes = ['/dashboard', '/dashboard/tasks'];
// 定义普通用户可访问的路由
const userRoutes = ['/dashboard/videos', '/dashboard/my-tasks', '/dashboard/profile'];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdminRoute = adminRoutes.some(route => nextUrl.pathname === route);
  
  // 如果未登录，重定向到登录页
  if (!isLoggedIn) {
    return Response.redirect(new URL('/auth/signin', nextUrl));
  }

  // 检查用户权限
  const isAdmin = req.auth?.user?.isAdmin;
  const isAdminOnlyRoute = adminOnlyRoutes.some(route => nextUrl.pathname === route);
  
  // 如果是管理员专属路由，但用户不是管理员
  if (isAdminOnlyRoute && !isAdmin) {
    // 重定向到视频页面
    return Response.redirect(new URL('/dashboard/videos', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
};
