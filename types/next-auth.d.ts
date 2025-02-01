import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    image: string | null;
    isAdmin: boolean;
  }

  interface Session {
    user: User;
    expires: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    image: string | null;
    isAdmin: boolean;
  }
}