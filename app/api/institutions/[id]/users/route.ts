export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json()
    const res = await backendFetch(BACKEND.institutions.users(id), {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = 'Failed to assign user to institution'
      try { const d = JSON.parse(text); message = d.message ?? message } catch { if (text) message = text }
      return NextResponse.json({ message }, { status: res.status })
    }
    const text = await res.text().catch(() => '')
    let data = {}
    try { if (text) data = JSON.parse(text) } catch { /* plain text ok */ }
    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
