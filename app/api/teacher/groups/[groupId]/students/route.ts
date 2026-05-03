export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await params
    const query = req.nextUrl.searchParams.toString()
    const base = BACKEND.teacher.groupStudents(groupId)
    const path = query ? `${base}?${query}` : base
    const res = await backendFetch(path)
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to fetch students' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
