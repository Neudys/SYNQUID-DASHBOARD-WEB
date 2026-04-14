export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

export async function GET() {
  try {
    const res = await backendFetch(BACKEND.users.list)
    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to fetch users' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    console.error('[api/users GET]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await backendFetch(BACKEND.users.create, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json({ message: data.message ?? 'Failed to create user' }, { status: res.status })
    }
    return NextResponse.json(await res.json(), { status: 201 })
  } catch (err) {
    console.error('[api/users POST]', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
