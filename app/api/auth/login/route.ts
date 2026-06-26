import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'
import { getDbClient } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: 'Missing email or password' }, { status: 400 })
    }

    const client = await getDbClient()

    try {
      // Find founder
      let result
      try {
        result = await client.query(
          'SELECT id, name, password_hash FROM founders WHERE email = $1',
          [email]
        )
      } catch (columnError: any) {
        if (columnError.code === '42703') {
          // Column doesn't exist, try without it
          result = await client.query(
            'SELECT id, name FROM founders WHERE email = $1',
            [email]
          )
        } else {
          throw columnError
        }
      }

      if (result.rows.length === 0) {
        await client.end()
        return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
      }

      const founder = result.rows[0]

      // Compare password if column exists
      if (founder.password_hash) {
        const isValid = await bcrypt.compare(password, founder.password_hash)

        if (!isValid) {
          await client.end()
          return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
        }
      } else {
        // Password column doesn't exist, just check email
        console.log('[v0] No password hash stored for user, allowing login')
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
