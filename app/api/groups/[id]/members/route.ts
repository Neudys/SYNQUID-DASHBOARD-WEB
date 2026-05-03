export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const query = searchParams.toString()
    const path = query ? `${BACKEND.groups.members(id)}?${query}` : BACKEND.groups.members(id)
    const res = await backendFetch(path)
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to fetch members' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json()
    const res = await backendFetch(BACKEND.groups.members(id), {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = 'Failed to add member'
      try { const d = JSON.parse(text); message = d.message ?? message } catch { if (text) message = text }
      return NextResponse.json({ message }, { status: res.status })
    }
    const text = await res.text().catch(() => '')
    let data = {}
    try { if (text) data = JSON.parse(text) } catch { /* ok */ }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
