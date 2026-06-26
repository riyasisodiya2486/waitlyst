import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { createSession } from '@/lib/session'
import { getDbClient } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    if (!email.includes('@')) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const client = await getDbClient()

    try {
      // Check if founder exists
      const existing = await client.query('SELECT id FROM founders WHERE email = $1', [email])

      if (existing.rows.length > 0) {
        await client.end()
        return NextResponse.json(
          { message: 'An account with this email already exists' },
          { status: 409 }
        )
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Create founder
      const founderId = uuidv4()
      const now = new Date()

      console.log('[v0] Creating founder with email:', email)
      
      // Try inserting with password_hash column, fallback if it doesn't exist
      let insertSuccess = false
      
      try {
        await client.query(
          'INSERT INTO founders (id, email, name, password_hash, plan, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [founderId, email, name, passwordHash, 'free', now]
        )
        insertSuccess = true
        console.log('[v0] Founder created with password_hash column')
      } catch (columnError: any) {
        if (columnError.code === '42703') {
          // Column doesn't exist, try without it
          console.log('[v0] password_hash column not found, inserting without it')
          await client.query(
            'INSERT INTO founders (id, email, name, plan, created_at) VALUES ($1, $2, $3, $4, $5)',
            [founderId, email, name, 'free', now]
          )
          insertSuccess = true
          
          // Try to add the column for next time
          try {
            await client.query('ALTER TABLE founders ADD COLUMN password_hash TEXT;')
            console.log('[v0] Added password_hash column for future use')
          } catch (alterError) {
            console.log('[v0] Could not add password_hash column:', alterError instanceof Error ? alterError.message : String(alterError))
          }
        } else {
          throw columnError
        }
      }
      
      if (!insertSuccess) {
        throw new Error('Failed to create founder')
      }

      console.log('[v0] Founder created successfully:', founderId)
      
      await client.end()

      // Create session
      await createSession(founderId)
      
      console.log('[v0] Session created for founder:', founderId)

      return NextResponse.json({
        id: founderId,
        email,
        name,
      })
    } catch (dbError) {
      console.error('[v0] Database error during signup:', {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        code: (dbError as any)?.code,
        detail: (dbError as any)?.detail,
      })
      try {
        await client.end()
      } catch (e) {
        // ignore
      }
      throw dbError
    }
  } catch (error) {
    console.error('[v0] Signup error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ message: 'Failed to create account' }, { status: 500 })
  }
}
