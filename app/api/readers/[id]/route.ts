export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const res = await backendFetch(BACKEND.readers.detail(id))
    if (!res.ok) {
      return NextResponse.json({ message: 'Reader not found' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    console.error('[api/readers/:id GET]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const body = await req.json()
    const res = await backendFetch(BACKEND.readers.update(id), {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json({ message: data.message ?? 'Failed to update reader' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    console.error('[api/readers/:id PUT]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const res = await backendFetch(BACKEND.readers.delete(id), { method: 'DELETE' })
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to delete reader' }, { status: res.status })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/readers/:id DELETE]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
