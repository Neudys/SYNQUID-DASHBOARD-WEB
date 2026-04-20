import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'
import { Role } from '@/lib/roles'

export { Role } from '@/lib/roles'
export type { RoleValue } from '@/lib/roles'

const COOKIE_NAME = 'synquid_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export interface CurrentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: number
  institutionId: string | null
  createdAt?: string
}

function normalizeRole(raw: unknown): number {
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const n = Number(raw)
    if (!isNaN(n)) return n
    const map: Record<string, number> = {
      superadmin: Role.SuperAdmin,
      admin: Role.Admin,
      professor: Role.Professor,
      proffesor: Role.Professor, // tolerate backend typo
      teacher: Role.Professor,
      student: Role.Student,
    }
    return map[raw.toLowerCase()] ?? Role.Student
  }
  return Role.Student
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS)
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', { ...COOKIE_OPTIONS, maxAge: 0 })
}

/**
 * Server-component guard. Redirects to /login if no token is present.
 */
export async function requireAuth(): Promise<string> {
  const token = await getAuthToken()
  if (!token) redirect('/login')
  return token
}

/**
 * Fetches the current user from the backend. Returns null on failure.
 * Tolerates both flat `{ id, firstName, ... }` and wrapped `{ userData: { ... } }` responses.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await backendFetch(BACKEND.auth.me)
    if (!res.ok) return null
    const body = await res.json()
    const raw = body?.userData ?? body ?? null
    if (!raw) return null
    return {
      id: raw.id ?? raw.Id ?? '',
      firstName: raw.firstName ?? raw.FirstName ?? '',
      lastName: raw.lastName ?? raw.LastName ?? '',
      email: raw.email ?? raw.Email ?? '',
      role: normalizeRole(raw.role ?? raw.Role),
      institutionId: raw.institutionId ?? raw.InstitutionId ?? null,
      createdAt: raw.createdAt ?? raw.CreatedAt,
    }
  } catch {
    return null
  }
}

/**
 * Server-component guard. Requires the current user to have one of the allowed roles.
 * Redirects to /login if unauthenticated, or /unauthorized if role is not allowed.
 */
export async function requireRole(allowed: number[]): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!allowed.includes(user.role)) redirect('/unauthorized')
  return user
}
