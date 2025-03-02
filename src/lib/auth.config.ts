import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';

// Extend the User type to include the token property and additional user details
interface CustomUser {
  id: string;
  name: string;
  login: string;
  token: string;
  address: string;
  email: string;
  phone_number: string;
  created_at: string;
}

// Extend the Session type to include the accessToken property and additional user details
declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      name: string;
      login: string;
      address: string;
      email: string;
      phone_number: string;
      created_at: string;
    };
  }
}

const authConfig = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? ''
    }),
    CredentialProvider({
      credentials: {
        username: {
          type: 'text',
          label: 'Username',
          placeholder: 'Enter your username'
        },
        password: {
          type: 'password',
          label: 'Password',
          placeholder: 'Enter your password'
        }
      },
      async authorize(credentials, req) {
        const creds = credentials as Partial<
          Record<'username' | 'password', string>
        >;
        if (!creds || !creds.username || !creds.password) {
          return null;
        }

        try {
          const loginResponse = await fetch('http://localhost:8000/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              username: creds.username,
              password: creds.password
            })
          });

          const loginData = await loginResponse.json();
          console.log('Login response data:', loginData);

          if (loginResponse.ok && loginData.access_token) {
            // Fetch user details
            const userResponse = await fetch(
              'http://localhost:8000/companies/me/',
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${loginData.access_token}`
                }
              }
            );

            if (userResponse.ok) {
              const userData = await userResponse.json();
              return {
                id: String(userData.id),
                name: userData.name,
                login: userData.login,
                token: loginData.access_token,
                address: userData.address,
                email: userData.email,
                phone_number: userData.phone_number,
                created_at: userData.created_at
              } as CustomUser;
            } else {
              console.error('Failed to fetch user data');
              return null;
            }
          } else {
            console.error('Login failed:', loginData);
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
      // Persist the token and user details in the JWT
      if (user) {
        const customUser = user as CustomUser;
        token.accessToken = customUser.token;
        token.id = customUser.id;
        token.name = customUser.name;
        token.login = customUser.login;
        token.address = customUser.address;
        token.email = customUser.email;
        token.phone_number = customUser.phone_number;
        token.created_at = customUser.created_at;
      }
      return token;
    },
    async session({ session, token }) {
      // Add the token and user details to the session
      session.accessToken = token.accessToken as string;
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.login = token.login as string;
      session.user.address = token.address as string;
      session.user.email = token.email as string;
      session.user.phone_number = token.phone_number as string;
      session.user.created_at = token.created_at as string;
      return session;
    }
  }
} satisfies NextAuthConfig;

export default authConfig;
