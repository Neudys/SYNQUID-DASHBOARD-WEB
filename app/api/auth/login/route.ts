export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_BASE_URL, BACKEND } from '@/lib/endpoints'
import { setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log(BACKEND_BASE_URL, BACKEND.auth.login)
    const res = await fetch(`${BACKEND_BASE_URL}${BACKEND.auth.login}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { message: data.message ?? 'Invalid credentials' },
        { status: res.status }
      )
    }

    const data = await res.json()
    const token: string = data.token ?? data.accessToken ?? data.access_token

    if (!token) {
      return NextResponse.json({ message: 'No token received from server' }, { status: 500 })
    }

    await setAuthCookie(token)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/auth/login]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
