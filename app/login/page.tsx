import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/login-form'
import { LoginVisual } from '@/components/login-visual'
import { getAuthToken } from '@/lib/auth'
import { BACKEND_BASE_URL, BACKEND } from '@/lib/endpoints'

async function isTokenValid(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}${BACKEND.auth.validateToken}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    return res.ok
  } catch (err) {
    return false
  }
}

export default async function LoginPage() {
  const token = await getAuthToken()

  if (token && (await isTokenValid(token))) {
    redirect('/dashboard')
  }

  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section
        className="relative flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16"
        aria-labelledby="login-heading"
      >
        <LoginForm />
      </section>
      <LoginVisual />
    </main>
  )
}
