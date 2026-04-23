export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function GET() {
  try {
    const res = await backendFetch(BACKEND.attendance.myHistory)
    if (!res.ok) return NextResponse.json([], { status: res.status })
    const data = await res.json()
    const records = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    return NextResponse.json(records)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
