import NextAuth from 'next-auth'
import Google from '@auth/core/providers/google'
import PostgresAdapter from '@auth/pg-adapter'
import { Client } from 'pg'
import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { v4 as uuidv4 } from 'uuid'

let signerInstance: DsqlSigner | null = null

function getSigner() {
  if (!signerInstance) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    
    if (!accessKeyId || !secretAccessKey) {
      console.warn('[v0] AWS credentials not set, using basic connection')
      // Return null to indicate signer not available
      return null as any
    }
    
    signerInstance = new DsqlSigner({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }
  return signerInstance
}

async function getClient() {
  const signer = getSigner()
  const client = new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    port: 5432,
    ssl: true,
    password: async () => {
      const token = await signer.sign({
        hostname: process.env.PGHOST || '',
        port: 5432,
        username: process.env.PGUSER || '',
      })
      return token
    },
  })

  await client.connect()
  return client
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
  ],
  adapter: PostgresAdapter(getClient),
  pages: {
    signIn: '/login',
  },
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      try {
        if (user.email && user.name) {
          console.log('[v0] User signed in:', user.email)
          // Founder creation will be handled by a separate API call after successful auth
        }
      } catch (error) {
        console.error('[v0] Error in signIn callback:', error)
      }
      return true
    },
  },
})
