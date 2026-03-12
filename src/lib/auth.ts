import { NextAuthOptions, getServerSession as nextGetServerSession, Session } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
    }
  }
  interface User {
    id: string
    email: string
    name: string
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findFirst({
          where: { email: credentials.email, deletedAt: null },
        })

        if (!user) throw new Error('Invalid email or password')

        const isPasswordValid = await compare(credentials.password, user.passwordHash)
        if (!isPasswordValid) throw new Error('Invalid email or password')

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = user.role }
      return token
    },
    async session({ session, token }) {
      if (token) { session.user.id = token.id; session.user.role = token.role }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function getServerSession() {
  return nextGetServerSession(authOptions)
}

type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: Response }

function forbidden(): AuthResult {
  return {
    session: null,
    error: Response.json({ success: false, data: null, error: 'Forbidden' }, { status: 403 }),
  }
}

function unauthorized(): AuthResult {
  return {
    session: null,
    error: Response.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 }),
  }
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession()
  if (!session) return unauthorized()
  return { session, error: null }
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireAuth()
  if (result.error) return result
  if (result.session.user.role !== UserRole.ADMIN) return forbidden()
  return result
}

export async function requireRecruiter(): Promise<AuthResult> {
  const result = await requireAuth()
  if (result.error) return result
  if (![UserRole.RECRUITER, UserRole.ADMIN].includes(result.session.user.role)) return forbidden()
  return result
}

export async function requireCandidate(): Promise<AuthResult> {
  const result = await requireAuth()
  if (result.error) return result
  if (result.session.user.role !== UserRole.CANDIDATE) return forbidden()
  return result
}

export function isAdmin(role: UserRole) { return role === UserRole.ADMIN }
export function isRecruiter(role: UserRole) { return role === UserRole.RECRUITER }
export function isCandidate(role: UserRole) { return role === UserRole.CANDIDATE }
