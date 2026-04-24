export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function GET() {
  try {
    const res = await backendFetch(BACKEND.readers.list)
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to fetch readers' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/readers GET]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await backendFetch(BACKEND.readers.create, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = 'Failed to create reader'
      try {
        const data = JSON.parse(text)
        message = data.message ?? message
      } catch {
        if (text) message = text
      }
      return NextResponse.json({ message }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[api/readers POST]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
