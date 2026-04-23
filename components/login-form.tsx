'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  ShieldCheckIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  AlertCircleIcon,
} from 'lucide-react'
import { DNA } from 'react-loader-spinner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

gsap.registerPlugin(useGSAP)

const REMEMBER_KEY = 'synquid_remember'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const { login, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY)
      if (saved) {
        const { email: savedEmail, password: savedPassword } = JSON.parse(saved)
        setEmail(savedEmail ?? '')
        setPassword(savedPassword ?? '')
        setRememberMe(true)
      }
    } catch { /* corrupted storage — ignore */ }
  }, [])

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return

      gsap.fromTo(
        '[data-form-item]',
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.06,
          clearProps: 'opacity,transform',
        },
      )
    },
    { scope: container },
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, password }))
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }
    await login({ email, password })
  }

  return (
    <>
      {loading && (
        <div
          role="status"
          aria-label="Signing in"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div className="flex items-center justify-center rounded-2xl bg-background shadow-2xl size-32.5">
            <DNA
              dnaColorOne = "#c2d8c4"
              dnaColorTwo = "#385144"
              visible
              height={90}
              width={90}
              ariaLabel="signing-in"
            />
          </div>
        </div>
      )}
    <div
      ref={container}
      className={cn('flex w-full max-w-sm flex-col gap-8', className)}
      {...props}
    >
      {/* Brand — visible on mobile where visual panel is hidden */}
      <div data-form-item className="flex items-center gap-2.5 lg:hidden">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheckIcon className="size-5" strokeWidth={2.25} />
        </div>
        <span className="text-lg font-semibold tracking-tight">Synquid</span>
      </div>

      <header data-form-item className="space-y-2">
        <h1
          id="login-heading"
          className="text-3xl font-semibold tracking-tight text-foreground"
        >
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Synquid admin account to continue.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          data-form-item
          className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <FloatingField
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          disabled={loading}
          autoComplete="email"
          icon={<MailIcon className="size-4" aria-hidden="true" />}
          dataAttr
        />

        <FloatingField
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          disabled={loading}
          autoComplete="current-password"
          icon={<LockIcon className="size-4" aria-hidden="true" />}
          dataAttr
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={loading}
              className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:opacity-50"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          }
        />

        <div data-form-item className="flex items-center justify-between text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 cursor-pointer rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="font-medium text-primary transition-colors duration-150 ease-out hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          data-form-item
          className="group bg-[#299679] text-white relative inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
        >
          {loading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
              <span className=''>Signing in…</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </button>
      </form>

      <p data-form-item className="text-center text-sm text-muted-foreground">
        Need an account?{' '}
        <a
          href="mailto:admin@synquid.io"
          className="font-medium text-foreground underline-offset-4 transition-colors duration-150 ease-out hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
        >
          Contact your admin
        </a>
      </p>
    </div>
    </>
  )
}

interface FloatingFieldProps {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  autoComplete?: string
  icon?: React.ReactNode
  trailing?: React.ReactNode
  dataAttr?: boolean
}

function FloatingField({
  id,
  label,
  type,
  value,
  onChange,
  disabled,
  autoComplete,
  icon,
  trailing,
  dataAttr,
}: FloatingFieldProps) {
  const hasValue = value.length > 0
  return (
    <div
      className="group relative"
      {...(dataAttr ? { 'data-form-item': true } : {})}
    >
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
        autoComplete={autoComplete}
        placeholder=" "
        className={cn(
          'peer block h-14 w-full rounded-lg border border-input bg-card pt-5 pb-1 text-[15px] text-foreground shadow-sm transition-[border-color,box-shadow,background-color] duration-200 ease-out',
          'placeholder:text-transparent',
          'hover:border-primary/40',
          'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
          'disabled:cursor-not-allowed disabled:opacity-60',
          icon ? 'pl-10' : 'pl-3.5',
          trailing ? 'pr-12' : 'pr-3.5',
        )}
      />
      {icon && (
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 ease-out group-focus-within:text-primary"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute text-muted-foreground transition-all duration-200 ease-out',
          icon ? 'left-10' : 'left-3.5',
          'peer-focus:text-primary peer-focus:text-xs peer-focus:top-2 peer-focus:translate-y-0',
          hasValue
            ? 'top-2 translate-y-0 text-xs'
            : 'top-1/2 -translate-y-1/2 text-[15px]',
        )}
      >
        {label}
      </label>
      {trailing && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</div>
      )}
    </div>
  )
}
