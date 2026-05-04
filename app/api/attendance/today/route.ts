export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.toString()
    const path = query ? `${BACKEND.attendance.today}?${query}` : BACKEND.attendance.today
    const res = await backendFetch(path)
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to fetch today attendance' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
