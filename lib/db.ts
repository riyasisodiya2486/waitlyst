import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { Client } from 'pg'

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

export async function getDbClient() {
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
