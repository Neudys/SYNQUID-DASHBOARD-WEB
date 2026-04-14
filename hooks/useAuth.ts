'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { API } from '@/lib/endpoints'

interface LoginPayload {
  email: string
  password: string
}

interface AuthState {
  loading: boolean
  error: string | null
}

export function useAuth() {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({ loading: false, error: null })

  const login = useCallback(async (payload: LoginPayload) => {
    setState({ loading: true, error: null })
    try {
      const res = await fetch(API.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setState({ loading: false, error: data.message ?? 'Invalid credentials' })
        return false
      }

      setState({ loading: false, error: null })
      router.push('/dashboard')
      router.refresh()
      return true
    } catch {
      setState({ loading: false, error: 'Network error. Please try again.' })
      return false
    }
  }, [router])

  const logout = useCallback(async () => {
    await fetch(API.auth.logout, { method: 'POST' })
    router.push('/login')
    router.refresh()
  }, [router])

  return { login, logout, ...state }
}
