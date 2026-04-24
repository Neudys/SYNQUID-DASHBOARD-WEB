export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const { id, userId } = await params
    const res = await backendFetch(BACKEND.groups.removeMember(id, userId), { method: 'DELETE' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = 'Failed to remove member'
      try { const d = JSON.parse(text); message = d.message ?? message } catch { if (text) message = text }
      return NextResponse.json({ message }, { status: res.status })
    }
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[api/groups/[id]/members/[userId] DELETE]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
