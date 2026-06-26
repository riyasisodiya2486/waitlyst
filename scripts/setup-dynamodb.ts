import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb'

async function setupDynamoDB() {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })

  const command = new CreateTableCommand({
    TableName: 'waitlyst-events',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TTL: {
      AttributeName: 'ttl',
      Enabled: true,
    },
  })

  try {
    console.log('[v0] Creating DynamoDB table: waitlyst-events')
    const result = await client.send(command)
    console.log('[v0] Table created successfully:', result.TableDescription?.TableName)
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log('[v0] Table already exists: waitlyst-events')
    } else {
      console.error('[v0] Failed to create table:', error.message)
      throw error
    }
  } finally {
    client.destroy()
  }
}

setupDynamoDB()
  .then(() => {
    console.log('[v0] DynamoDB setup completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[v0] DynamoDB setup failed:', error)
    process.exit(1)
  })
