'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserIcon, KeyRoundIcon, CheckIcon } from 'lucide-react'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

interface User {
  id: string
  name: string
  email: string
  role?: string
}

interface SettingsFormProps {
  user: User | null
}

export function SettingsForm({ user }: SettingsFormProps) {
  const container = useRef<HTMLDivElement>(null)

  // Profile state
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id) return
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully.' })
      } else {
        const data = await res.json().catch(() => ({}))
        setProfileMsg({ type: 'error', text: data.message ?? 'Failed to update profile.' })
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setProfileSaving(false)
    }
  }

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
    if (!user?.id) return
    setPasswordSaving(true)
    setPasswordMsg(null)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
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
            <p className="text-xs text-muted-foreground">
              Update your name and email address.
            </p>
          </div>
          {user?.role && (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
              {user.role}
            </span>
          )}
        </div>
        <div className="p-5">
          {!user ? (
            <p className="text-sm text-muted-foreground">
              Could not load profile. Make sure the backend is running.
            </p>
          ) : (
            <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
              {profileMsg && (
                <Alert
                  variant={profileMsg.type === 'error' ? 'destructive' : 'default'}
                  className={
                    profileMsg.type === 'success'
                      ? 'border-teal/40 bg-teal/10 text-teal'
                      : ''
                  }
                >
                  <AlertDescription className="flex items-center gap-2">
                    {profileMsg.type === 'success' && <CheckIcon className="size-4" />}
                    {profileMsg.text}
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-name">Name</Label>
                  <Input
                    id="settings-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    disabled={profileSaving}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input
                    id="settings-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    disabled={profileSaving}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
                  disabled={profileSaving || !name.trim() || !email.trim()}
                >
                  {profileSaving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          )}
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
                  passwordMsg.type === 'success'
                    ? 'border-teal/40 bg-teal/10 text-teal'
                    : ''
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
