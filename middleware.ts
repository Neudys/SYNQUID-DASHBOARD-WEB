import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

function isTokenFresh(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload) return false
  const exp = typeof payload.exp === 'number' ? payload.exp : null
  if (exp === null) return true
  return Date.now() / 1000 < exp
}

function redirectToLogin(req: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  const res = NextResponse.redirect(loginUrl)
  res.cookies.set('synquid_token', '', { maxAge: 0, path: '/' })
  return res
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('synquid_token')?.value

  if (token && pathname.startsWith('/login')) {
    if (isTokenFresh(token)) return NextResponse.redirect(new URL('/dashboard', req.url))
    const res = NextResponse.next()
    res.cookies.set('synquid_token', '', { maxAge: 0, path: '/' })
    return res
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  if (!token) return redirectToLogin(req, pathname)
  if (!isTokenFresh(token)) return redirectToLogin(req, pathname)

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/api/attendance/:path*', '/api/readers/:path*', '/api/users/:path*', '/api/nfc/:path*'],
}
