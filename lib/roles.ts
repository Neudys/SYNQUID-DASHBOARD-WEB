/**
 * Role values as sent by the backend (numeric).
 * 0 = SuperAdmin, 1 = Admin, 2 = Professor, 3 = Student.
 *
 * Kept in a separate file from auth.ts so client components can import it
 * without pulling in server-only deps (next/headers, redirect, etc.).
 */
export const Role = {
  SuperAdmin: 0,
  Admin: 1,
  Professor: 2,
  Student: 3,
} as const

export type RoleValue = (typeof Role)[keyof typeof Role]
