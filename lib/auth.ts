import NextAuth from 'next-auth'
import Google from '@auth/core/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/login',
  },
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      console.log('[v0] User signed in:', user.email)
      return true
    },
    async session({ session }) {
      return session
    },
  },
})
