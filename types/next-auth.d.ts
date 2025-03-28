import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    username: string;
    email?: string;
    name?: string;
    image?: string;
  }

  interface CredentialsInputs {
    username: string;
    password: string;
  }
}
