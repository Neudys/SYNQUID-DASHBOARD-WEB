export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const res = await backendFetch(BACKEND.attendance.delete(id), { method: 'DELETE' })
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to delete attendance record' }, { status: res.status })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/attendance DELETE]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
