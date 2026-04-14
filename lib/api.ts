import { cookies } from 'next/headers'
import { BACKEND_BASE_URL } from '@/lib/endpoints'

/**
 * Server-side fetch helper that proxies requests to the ASP.NET backend.
 * Automatically attaches the JWT from the HttpOnly cookie.
 */
export async function backendFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const cookieStore = await cookies()
  const token = cookieStore.get('synquid_token')?.value

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  return fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  })
}
