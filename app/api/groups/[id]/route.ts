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
    const res = await backendFetch(BACKEND.groups.detail(id))
    if (!res.ok) {
      return NextResponse.json({ message: 'Group not found' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json()
    const res = await backendFetch(BACKEND.groups.update(id), {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let data: Record<string, unknown> = {}
      try { if (text) data = JSON.parse(text) } catch { /* raw text */ }
      return NextResponse.json({ message: 'Failed to update group', backendError: data || text }, { status: res.status })
    }
    const text = await res.text().catch(() => '')
    let data = {}
    try { if (text) data = JSON.parse(text) } catch { /* ok */ }
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const res = await backendFetch(BACKEND.groups.delete(id), { method: 'DELETE' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = 'Failed to delete group'
      try { const d = JSON.parse(text); message = d.message ?? message } catch { if (text) message = text }
      return NextResponse.json({ message }, { status: res.status })
    }
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
