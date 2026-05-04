export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const res = await backendFetch(BACKEND.readers.regenerateKey(id), { method: 'POST' })
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to regenerate key' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
