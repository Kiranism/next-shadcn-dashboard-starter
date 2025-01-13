// Protecting routes with next-auth
// https://next-auth.js.org/configuration/nextjs#middleware
// https://nextjs.org/docs/app/building-your-application/routing/middleware

import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import authConfig from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const loggedin = req.cookies.get('mechchant_admin_user');
  // if (!req.auth) {
  //   const url = req.url.replace(req.nextUrl.pathname, '/');
  //   return Response.redirect(url);
  // }
  if (!loggedin) {
    const absoluteURL = new URL('/', req.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }
});

export const config = { matcher: ['/dashboard/:path*'] };
