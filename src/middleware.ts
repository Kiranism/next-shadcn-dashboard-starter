import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

// 开发环境中间件：允许直接访问 dashboard
export default auth((req) => {
  // 开发环境下直接放行
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }
  
  // 生产环境下检查认证
  if (!req.auth) {
    const url = req.url.replace(req.nextUrl.pathname, '/');
    return Response.redirect(url);
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
};
