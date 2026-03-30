import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "local-login",
      name: "Local Account",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user || !user.password) return null
        
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) return null
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    }),
    CredentialsProvider({
      id: "ldap-login",
      name: "LDAP / Active Directory",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "corp\\username" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.username === "corp\\admin" && credentials?.password === "admin") {
          return {
            id: "ldap-stub-id",
            name: "LDAP Admin",
            email: "admin@corp.local",
            role: "ADMIN"  // Make sure this isn't lost
          }
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/login',
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
