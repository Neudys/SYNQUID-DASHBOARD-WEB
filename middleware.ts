import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_BASE_URL, BACKEND } from '@/lib/endpoints'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}${BACKEND.auth.validateToken}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

function redirectToLogin(req: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  const response = NextResponse.redirect(loginUrl)
  response.cookies.set('synquid_token', '', { maxAge: 0, path: '/' })
  return response
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('synquid_token')?.value

  // If on login page with a token, validate and redirect to dashboard if valid
  if (token && pathname.startsWith('/login')) {
    const valid = await validateToken(token)
    if (valid) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    // Token invalid — clear cookie and let them stay on login
    const response = NextResponse.next()
    response.cookies.set('synquid_token', '', { maxAge: 0, path: '/' })
    return response
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  // No token — redirect to login
  if (!token) return redirectToLogin(req, pathname)

  // Validate token on protected routes
  const valid = await validateToken(token)
  if (!valid) return redirectToLogin(req, pathname)

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/api/attendance/:path*', '/api/readers/:path*', '/api/users/:path*', '/api/nfc/:path*'],
}
