import { Client } from 'pg'
import { DsqlSigner } from '@aws-sdk/dsql-signer'

const signer = new DsqlSigner({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export async function withDsql<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
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

  try {
    await client.connect()
    return await callback(client)
  } finally {
    await client.end()
  }
}

export async function query(sql: string, params: any[] = []) {
  return withDsql(async (client) => {
    const result = await client.query(sql, params)
    return result.rows
  })
}

export async function queryOne(sql: string, params: any[] = []) {
  return withDsql(async (client) => {
    const result = await client.query(sql, params)
    return result.rows[0] || null
  })
}

export async function execute(sql: string, params: any[] = []) {
  return withDsql(async (client) => {
    const result = await client.query(sql, params)
    return result.rowCount
  })
}
