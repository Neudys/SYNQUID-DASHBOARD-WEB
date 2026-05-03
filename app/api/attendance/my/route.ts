export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.toString()
    const path = query ? `${BACKEND.attendance.myHistory}?${query}` : BACKEND.attendance.myHistory
    const res = await backendFetch(path)
    if (!res.ok) return NextResponse.json([], { status: res.status })
    const data = await res.json()
    const records = Array.isArray(data?.attendances)
      ? data.attendances
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : []
    return NextResponse.json(records)
  } catch (err) {
    return NextResponse.json([], { status: 500 })
  }
}
