export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function GET() {
  try {
    const res = await backendFetch(BACKEND.auth.me)
    console.log('Fetch /api/User/me response:', res)
    if (!res.ok) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    console.error('[api/auth/me]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
