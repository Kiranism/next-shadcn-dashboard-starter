//@ts-nocheck
// auth.ts
import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import { IUserAuthResponse } from 'types/schema/user.schema';

const authConfig = {
  providers: [
    CredentialProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
        remember_me: { type: 'number' }
      },
      async authorize(credentials) {
        const userRes = await fetch(
          [
            process.env.API_BASE_URL,
            process.env.API_VERSION,
            'auth',
            'login'
          ].join('/'),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          }
        );

        if (!userRes.ok) return null;

        const mData = (await userRes.json()) as IUserAuthResponse;
        if (!mData.payload) return null;

        console.log(
          '[Auth Config] Authorize > Login Successful > User >',
          mData
        );

        const mCookies = await cookies();
        if (process.env.COOKIE_AUTH_TOKEN) {
          mCookies.set(
            process.env.COOKIE_AUTH_TOKEN,
            mData.payload.access_token
          );
        }

        return {
          ...mData.payload,
          accessToken: mData.payload.access_token,
          refreshToken: mData.payload.refresh_token,
          expiresAt: Math.floor(new Date(mData.payload.created_at) / 1000) + 60 // Assuming 1 minutes expiry
        };
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account }) {
      console.log('[Auth Config] JWT Callback: Start');
      // Initial sign in
      if (user) {
        console.log('[Auth Config] JWT Callback: End > Initial Sign In >', {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          expiresAt: user.expiresAt
        });

        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          expiresAt: user.expiresAt
        };
      }

      // Check if token is expired or about to expire (within 1 minute)
      const now = Math.floor(Date.now() / 1000);
      console.log('[Auth Config] JWT Callback: Refresh token Condition >', {
        expiresAt: token.expiresAt,
        nextMinute: now + 60,
        condition: now + 60 >= token.expiresAt,
        fullCondition: token.expiresAt && now + 60 >= token.expiresAt
      });
      if (token.expiresAt && now + 60 >= token.expiresAt) {
        console.log('[Auth Config] JWT Callback: Trying to refresh token');
        try {
          console.log('Trying to refresh token');
          const refreshed = await refreshAccessToken(
            token.refreshToken,
            token.accessToken
          );
          return {
            ...token,
            accessToken: refreshed.accessToken,
            expiresAt: refreshed.expiresAt,
            refreshToken: refreshed.refreshToken // Update if your API returns a new refresh token
          };
        } catch (error) {
          console.error(
            '[Auth Config] JWT Callback > Token refresh failed:',
            error
          );
          return { ...token, error: 'RefreshAccessTokenError' };
        }
      }

      console.log('[Auth Config] JWT Callback: End');
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    }
  },
  pages: {
    signIn: '/'
  }
} satisfies NextAuthConfig;

async function refreshAccessToken(refreshToken: string, accessToken: string) {
  console.log('[Auth Config] Refresh Token > Data >', {
    accessToken,
    refreshToken
  });

  const response = await fetch(
    [
      process.env.API_BASE_URL,
      process.env.API_VERSION,
      'auth',
      'refresh-token'
    ].join('/'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ refreshToken })
    }
  );

  if (!response.ok) {
    const data = await response.json();
    console.log('Refresh Token Provider > Refresh Token Error >', data);
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return {
    accessToken: data.payload.access_token,
    refreshToken: data.payload.refresh_token || refreshToken, // Keep old refresh token if new one isn't provided
    expiresAt: Math.floor(Date.now() / 1000) + 600 // 10 minutes
  };
}

export default authConfig;
