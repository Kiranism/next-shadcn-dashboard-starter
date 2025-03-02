import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';

const authConfig = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? ''
    }),
    CredentialProvider({
      credentials: {
        username: {
          type: 'username'
        },
        password: {
          type: 'password'
        }
      },
      async authorize(credentials, req) {
        try {
          const response = await fetch('http://localhost:8000/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              username: credentials?.username,
              password: credentials?.password
            })
          });

          const data = await response.json();
          console.log('Response data:', data);

          if (response.ok && data.access_token) {
            return {
              id: data.user?.id || 'default-id',
              name: data.user?.name || 'default-name',
              username: credentials?.username,
              token: data.access_token
            };
          } else {
            console.error('Login failed:', data);
            return null;
          }
        } catch (error) {
          console.error('Error during authorization:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/', // Sign-in page
    signOut: '/auth/signout', // Optional: Sign-out page
    error: '/auth/error', // Error page
    verifyRequest: '/auth/verify-request', // Verification page
    newUser: '/dashboard' // Redirect new users to the dashboard
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the token in the JWT
      if (user) {
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      // Add the token to the session
      session.accessToken = token.accessToken;
      return session;
    }
  }
} satisfies NextAuthConfig;

export default authConfig;
