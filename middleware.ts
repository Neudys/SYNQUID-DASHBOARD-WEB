import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_BASE_URL, BACKEND } from '@/lib/endpoints'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('synquid_token')?.value

  if (token && pathname.startsWith('/login')) {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}${BACKEND.auth.validateToken}`, {
        method : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } catch (err) {
      console.log('[middleware] validateToken error:', err)
    }
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/api/attendance/:path*', '/api/readers/:path*', '/api/users/:path*'],
}
