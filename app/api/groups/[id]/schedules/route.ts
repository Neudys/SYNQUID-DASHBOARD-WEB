export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const res = await backendFetch(BACKEND.groups.schedules(id))
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to fetch schedule' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
