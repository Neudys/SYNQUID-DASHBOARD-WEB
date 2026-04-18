'use client'

import { useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  UserIcon,
  KeyRoundIcon,
  CheckIcon,
  PaletteIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  MailIcon,
  BuildingIcon,
  ShieldIcon,
  CalendarIcon,
} from 'lucide-react'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

interface User {
  id: string
  firstName?: string
  lastName?: string
  email: string
  role?: string
  institutionId?: string | null
  createdAt?: string
  // Legacy/alternative capitalizations from backend DTO
  FirstName?: string
  LastName?: string
  Email?: string
  Role?: string
  InstitutionId?: string | null
  CreatedAt?: string
  Id?: string
}

interface SettingsFormProps {
  user: User | null
  institutionName: string | null
}

function pick<T>(...candidates: (T | undefined | null)[]): T | undefined {
  for (const c of candidates) if (c !== undefined && c !== null) return c
  return undefined
}

function initials(first?: string, last?: string): string {
  const f = first?.trim()?.[0] ?? ''
  const l = last?.trim()?.[0] ?? ''
  return (f + l).toUpperCase() || '—'
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export function SettingsForm({ user, institutionName }: SettingsFormProps) {
  const container = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

  const firstName = pick(user?.firstName, user?.FirstName) ?? ''
  const lastName = pick(user?.lastName, user?.LastName) ?? ''
  const email = pick(user?.email, user?.Email) ?? ''
  const role = pick(user?.role, user?.Role)
  const createdAt = pick(user?.createdAt, user?.CreatedAt)
  const userId = pick(user?.id, user?.Id)
  const fullName = `${firstName} ${lastName}`.trim() || '—'

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '[data-settings-card]',
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.entrance,
          ease: EASE.out,
          stagger: STAGGER.normal,
          clearProps: 'opacity,transform',
        },
      )
    },
    { scope: container },
  )

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    if (!userId) return
    setPasswordSaving(true)
    setPasswordMsg(null)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, password: newPassword }),
      })
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json().catch(() => ({}))
        setPasswordMsg({ type: 'error', text: data.message ?? 'Failed to change password.' })
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setPasswordSaving(false)
    }
  }

  const themeOptions: { value: string; label: string; icon: typeof SunIcon }[] = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: MonitorIcon },
  ]

  return (
    <div ref={container} className="flex flex-col gap-6">
      {/* Profile card */}
      <section
        data-settings-card
        className="overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 border-b border-border/50 bg-linear-to-r from-primary/8 via-transparent to-transparent px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserIcon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">Profile</h3>
            <p className="text-xs text-muted-foreground">Your account information.</p>
          </div>
        </div>

        {!user ? (
          <div className="p-5">
            <p className="text-sm text-muted-foreground">
              Could not load profile. Make sure the backend is running.
            </p>
          </div>
        ) : (
          <>
            {/* Avatar + name header */}
            <div className="flex flex-col items-center gap-3 border-b border-border/40 bg-linear-to-b from-primary/5 to-transparent px-5 py-6">
              <Avatar size="lg" className="size-20 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {initials(firstName, lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground">{fullName}</p>
                {role && (
                  <span className="mt-1.5 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                    {role}
                  </span>
                )}
              </div>
            </div>

            {/* Info grid */}
            <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
              <InfoRow icon={MailIcon} label="Email" value={email || '—'} />
              <InfoRow icon={ShieldIcon} label="Role" value={role ?? '—'} />
              <InfoRow
                icon={BuildingIcon}
                label="Institution"
                value={institutionName ?? '—'}
              />
              <InfoRow icon={CalendarIcon} label="Member since" value={formatDate(createdAt)} />
            </dl>
          </>
        )}
      </section>

      {/* Preferences card */}
      <section
        data-settings-card
        className="overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 border-b border-border/50 bg-linear-to-r from-sage/15 via-transparent to-transparent px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sage/30 text-forest dark:bg-sage/15 dark:text-sage">
            <PaletteIcon className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
            <p className="text-xs text-muted-foreground">Customize how the dashboard looks.</p>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-3">
            <Label className="text-sm">Theme</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {themeOptions.map((opt) => {
                const active = theme === opt.value
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.98] ${
                      active
                        ? 'border-primary/60 bg-primary/10 text-primary ring-1 ring-primary/40'
                        : 'border-border/60 bg-background/40 text-foreground hover:border-border hover:bg-secondary/50'
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{opt.label}</span>
                    {active && <CheckIcon className="ml-auto size-4" />}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              &quot;System&quot; follows your operating system preference.
            </p>
          </div>
        </div>
      </section>

      {/* Change password card */}
      <section
        data-settings-card
        className="overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 border-b border-border/50 bg-linear-to-r from-teal/8 via-transparent to-transparent px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-teal/15 text-teal">
            <KeyRoundIcon className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
            <p className="text-xs text-muted-foreground">
              Choose a strong password of at least 8 characters.
            </p>
          </div>
        </div>
        <div className="p-5">
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            {passwordMsg && (
              <Alert
                variant={passwordMsg.type === 'error' ? 'destructive' : 'default'}
                className={
                  passwordMsg.type === 'success' ? 'border-teal/40 bg-teal/10 text-teal' : ''
                }
              >
                <AlertDescription className="flex items-center gap-2">
                  {passwordMsg.type === 'success' && <CheckIcon className="size-4" />}
                  {passwordMsg.text}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                disabled={passwordSaving}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
                  disabled={passwordSaving}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={passwordSaving}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
                disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              >
                {passwordSaving ? 'Updating…' : 'Update password'}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof SunIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-1 truncate text-sm font-medium capitalize text-foreground">{value}</dd>
      </div>
    </div>
  )
}
