import { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

// 定义凭证类型
interface Credentials {
  username: string
  password: string
}

// 定义会话用户类型
interface SessionUser {
  id: string
  name: string
  email: string
  image: string | null
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: { 
          label: 'Username',
          type: 'text',
          placeholder: 'Enter your username'
        },
        password: { 
          label: 'Password',
          type: 'password',
          placeholder: 'Enter your password'
        }
      },
      async authorize(credentials): Promise<SessionUser | null> {
        try {
          console.log('Auth attempt for username:', credentials?.username)

          if (!credentials?.username || !credentials?.password) {
            console.log('Missing credentials')
            return null
          }

          const user = await prisma.user.findUnique({
            where: {
              username: credentials.username
            },
            select: {
              id: true,
              username: true,
              password: true,
              image: true
            }
          })

          console.log('Found user:', user ? 'Yes' : 'No')

          if (!user || !user.password) {
            console.log('User not found or no password')
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)
          console.log('Password valid:', isValid)

          if (!isValid) {
            console.log('Invalid password')
            return null
          }

          console.log('Authentication successful')
          return {
            id: user.id,
            name: user.username,
            email: user.username,
            image: user.image
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt' as const
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT Callback - Token:', token)
      console.log('JWT Callback - User:', user)
      
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session Callback - Session:', session)
      console.log('Session Callback - Token:', token)
      
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string | null
      }
      return session
    }
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || 'your-secret-key',
  debug: true
} satisfies NextAuthConfig

export default authConfig
