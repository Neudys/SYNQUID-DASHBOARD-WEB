export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { clearAuthCookie } from '@/lib/auth'
import { BACKEND } from '@/lib/endpoints'

export async function POST() {
  try {
    await backendFetch(BACKEND.auth.logout, { method: 'POST' })
  } catch {
    // Ignore backend errors on logout — clear the cookie regardless
  }

  await clearAuthCookie()
  return NextResponse.json({ ok: true })
}
