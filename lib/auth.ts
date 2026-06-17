import NextAuth from 'next-auth'
import Google from '@auth/core/providers/google'
import PostgresAdapter from '@auth/pg-adapter'
import { Client } from 'pg'
import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { v4 as uuidv4 } from 'uuid'

let signerInstance: DsqlSigner | null = null

function getSigner() {
  if (!signerInstance) {
    signerInstance = new DsqlSigner({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
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

async function ensureFounderExists(email: string, name: string) {
  try {
    const client = await getClient()
    
    // Check if founder already exists
    const result = await client.query('SELECT id FROM founders WHERE email = $1', [email])
    
    if (result.rows.length === 0) {
      // Create founder on first login
      const founderId = uuidv4()
      await client.query(
        'INSERT INTO founders (id, email, name, plan, created_at) VALUES ($1, $2, $3, $4, $5)',
        [founderId, email, name, 'free', new Date()]
      )
      console.log('[v0] Created new founder:', founderId, 'for', email)
    }
    
    await client.end()
  } catch (error) {
    console.error('[v0] Error ensuring founder exists:', error)
  }
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
  callbacks: {
    async signIn({ user }) {
      if (user.email && user.name) {
        await ensureFounderExists(user.email, user.name)
      }
      return true
    },
  },
})
