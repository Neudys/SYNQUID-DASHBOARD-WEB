export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await backendFetch(BACKEND.nfc.assignCard, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const rawText = await res.text()
    let data: Record<string, unknown> = {}
    try { data = JSON.parse(rawText) } catch { /* not JSON */ }

    if (!res.ok) {
      return NextResponse.json(
        { message: (data.message as string) ?? 'Failed to assign NFC card' },
        { status: res.status }
      )
    }
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
