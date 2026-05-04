export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function POST(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.toString()
    const path = query ? `${BACKEND.attendance.manual}?${query}` : BACKEND.attendance.manual
    const body = await req.text()
    const res = await backendFetch(path, {
      method: 'POST',
      body: body || undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
