export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_BASE_URL, BACKEND } from '@/lib/endpoints'
import { setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const url = `${BACKEND_BASE_URL}${BACKEND.auth.login}`
    console.log('[login] POST', url, { email: body.email })

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    console.log('[login] backend status:', res.status, res.statusText)

    const rawText = await res.text()
    console.log('[login] backend body:', rawText)

    let data: Record<string, unknown> = {}
    try { data = JSON.parse(rawText) } catch { /* not JSON */ }

    if (!res.ok) {
      return NextResponse.json(
        { message: (data.message as string) ?? 'Invalid credentials' },
        { status: res.status }
      )
    }

    const token: string = (data.token ?? data.accessToken ?? data.access_token) as string

    if (!token) {
      console.error('[login] no token field in response, keys:', Object.keys(data))
      return NextResponse.json({ message: 'No token received from server' }, { status: 500 })
    }

    await setAuthCookie(token)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/auth/login]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
