export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.toString()
    const path = query ? `${BACKEND.groups.list}?${query}` : BACKEND.groups.list
    const res = await backendFetch(path)
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to fetch groups' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await backendFetch(BACKEND.groups.create, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = 'Failed to create group'
      try { const d = JSON.parse(text); message = d.message ?? message } catch { if (text) message = text }
      return NextResponse.json({ message }, { status: res.status })
    }
    return NextResponse.json(await res.json(), { status: 201 })
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
