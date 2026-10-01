import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'
import { getDbClient } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email: rawEmail, password } = body ?? {}

    if (typeof rawEmail !== 'string' || typeof password !== 'string' || !rawEmail.trim() || !password) {
      return NextResponse.json({ message: 'Missing email or password' }, { status: 400 })
    }
    const email = rawEmail.trim().toLowerCase()

    const client = await getDbClient()

    try {
      const result = await client.query(
        'SELECT id, name, password_hash FROM founders WHERE email = $1',
        [email]
      )

      if (result.rows.length === 0) {
        await client.end()
        return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
      }

      const founder = result.rows[0]

      // Never authenticate legacy/incomplete accounts without a stored password hash.
      if (typeof founder.password_hash !== 'string' || !founder.password_hash) {
        await client.end()
        return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
      }

      const isValid = await bcrypt.compare(password, founder.password_hash)
      if (!isValid) {
        await client.end()
        return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
      }

      await client.end()

      // Create session
      await createSession(founder.id)

      return NextResponse.json({
        id: founder.id,
        email,
        name: founder.name,
      })
    } catch (dbError) {
      try {
        await client.end()
      } catch (e) {
        // ignore
      }
      console.error('[v0] Login database error:', dbError instanceof Error ? dbError.message : String(dbError))
      throw dbError
    }
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json({ message: 'Failed to sign in' }, { status: 500 })
  }
}
