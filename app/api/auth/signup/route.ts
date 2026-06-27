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

      console.log('[signup] Inserting founder:', email, 'id:', founderId)

      await client.query(
        'INSERT INTO founders (id, email, name, password_hash, plan, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [founderId, email, name, passwordHash, 'free', now]
      )

      console.log('[signup] Founder created successfully:', founderId)

      await client.end()

      // Create session
      await createSession(founderId)

      console.log('[signup] Session created for founder:', founderId)

      return NextResponse.json({
        id: founderId,
        email,
        name,
      })
    } catch (dbError: any) {
      console.error('[signup] Database error:', {
        message: dbError?.message,
        code: dbError?.code,
        detail: dbError?.detail,
        hint: dbError?.hint,
        stack: dbError?.stack,
      })
      try { await client.end() } catch (_) { /* ignore */ }
      throw dbError
    }
  } catch (error: any) {
    console.error('[signup] Unhandled error:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { message: error?.message || 'Failed to create account' },
      { status: 500 }
    )
  }
}
