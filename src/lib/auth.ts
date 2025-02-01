import NextAuth, { NextAuthConfig } from 'next-auth';
import authConfig from './auth.config';

const typedAuthConfig: NextAuthConfig = authConfig;

export const { auth, handlers, signOut, signIn } = NextAuth(typedAuthConfig);