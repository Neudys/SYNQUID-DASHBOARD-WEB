'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { UserIcon, KeyRoundIcon, CheckIcon } from 'lucide-react'

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
    <div className="flex flex-col gap-6">
      {/* Profile card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-forest/10 text-forest">
              <UserIcon className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription className="text-sm">Update your name and email address.</CardDescription>
            </div>
            {user?.role && (
              <Badge variant="secondary" className="ml-auto bg-forest/10 text-forest border-0 capitalize">
                {user.role}
              </Badge>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {!user ? (
            <p className="text-sm text-muted-foreground">
              Could not load profile. Make sure the backend is running.
            </p>
          ) : (
            <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
              {profileMsg && (
                <Alert variant={profileMsg.type === 'error' ? 'destructive' : 'default'}
                  className={profileMsg.type === 'success' ? 'border-forest/30 bg-forest/5 text-forest' : ''}>
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
                  className="bg-forest hover:bg-forest/90 text-cream"
                  disabled={profileSaving || !name.trim() || !email.trim()}
                >
                  {profileSaving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Change password card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-forest/10 text-forest">
              <KeyRoundIcon className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription className="text-sm">Choose a strong password of at least 8 characters.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            {passwordMsg && (
              <Alert variant={passwordMsg.type === 'error' ? 'destructive' : 'default'}
                className={passwordMsg.type === 'success' ? 'border-forest/30 bg-forest/5 text-forest' : ''}>
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
                className="bg-forest hover:bg-forest/90 text-cream"
                disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              >
                {passwordSaving ? 'Updating…' : 'Update password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
