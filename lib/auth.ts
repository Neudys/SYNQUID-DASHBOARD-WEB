import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE_NAME = 'synquid_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

/**
 * Returns the raw JWT string from the HttpOnly cookie, or null if absent.
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

/**
 * Sets the HttpOnly JWT cookie. Call from server actions or API route handlers.
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS)
}

/**
 * Clears the JWT cookie (logout).
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', { ...COOKIE_OPTIONS, maxAge: 0 })
}

/**
 * Server-component guard. Redirects to /login if no token is present.
 * Use at the top of protected Server Components or layouts.
 */
export async function requireAuth(): Promise<string> {
  const token = await getAuthToken()
  if (!token) {
    redirect('/login')
  }
  return token
}
