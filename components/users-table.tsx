'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, EyeIcon, EyeOffIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react'
import { API } from '@/lib/endpoints'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'
import { clientCache } from '@/lib/client-cache'
import { number } from 'zod'

gsap.registerPlugin(useGSAP)

interface Institution {
  id: string
  name: string
}

interface User {
  id: string
  firstName?: string
  name: string
  lastName?: string
  email: string
  role?: string
  password?: string
  institutionId?: string
}

const ROLES: Record<string, string> = {
  '0': 'SuperAdmin',
  '1': 'Admin',
  '2': 'Professor',
  '3': 'Student',
}

const EMPTY: User = { id: '', firstName: '', name: '', lastName: '', email: '', role: '3', password: '', institutionId: '' }
const PAGE_SIZE = 10

const roleStyles: Record<string, string> = {
  '0': 'bg-destructive/10 text-destructive',
  '1': 'bg-primary/12 text-primary',
  '2': 'bg-teal/15 text-teal',
  '3': 'bg-sage/40 text-forest dark:bg-sage/15 dark:text-sage',
}

function normalizeRole(role: string | number | undefined): string {
  return ROLES[String(role ?? 3)] ?? 'Student'
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

export function UsersTable() {
  const container = useRef<HTMLDivElement>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User & { password?: string }>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [institutions, setInstitutions] = useState<Institution[]>([])

  useEffect(() => {
    const cached = clientCache.get<Institution[]>('institutions')
    if (cached) { setInstitutions(cached) }
    fetch(API.institutions)
      .then((r) => r.json())
      .then((data) => {
        const list: Institution[] = Array.isArray(data) ? data : data.institutions ?? []
        clientCache.set('institutions', list)
        setInstitutions(list)
      })
      .catch(() => {})
  }, [])

  const fetchUsers = useCallback(async (targetPage: number, force = false) => {
    const cacheKey = `users_p${targetPage}`
    const cached = clientCache.get<{ users: User[]; total: number }>(cacheKey)
    if (cached && !force) {
      setUsers(cached.users)
      setTotalUsers(cached.total)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API.users}?page=${targetPage}`)
      if (!res.ok) return
      const data = await res.json()
      const list: User[] = Array.isArray(data) ? data : data.users ?? []
      const total: number = data.totalUsers ?? list.length
      clientCache.set(cacheKey, { users: list, total })
      setUsers(list)
      setTotalUsers(total)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers(page)
  }, [fetchUsers, page])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '[data-surface]',
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.entrance,
          ease: EASE.out,
          clearProps: 'opacity,transform',
        },
      )
    },
    { scope: container },
  )

  useGSAP(
    () => {
      if (prefersReducedMotion() || loading) return
      gsap.fromTo(
        '[data-row]',
        { opacity: 0, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.standard,
          ease: EASE.out,
          stagger: STAGGER.tight,
          clearProps: 'opacity,transform',
        },
      )
    },
    { scope: container, dependencies: [loading, users] },
  )

  function openCreate() {
    setEditing(EMPTY)
    setShowPassword(false)
    setSaveError(null)
    setDialogOpen(true)
  }

  function openEdit(user: User) {
    setEditing({ 
      ...user, 
      role: String(user.role ?? '3'), 
      password: '', 
      institutionId: '',
      firstName: user.firstName ?? user.name ?? '',
      lastName: user.lastName ?? ''
    })
    setShowPassword(false)
    setSaveError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const isNew = !editing.id
      const url = isNew ? API.users : `${API.users}/${editing.id}`
      const method = isNew ? 'POST' : 'PUT'
      const payload: Record<string, unknown> = {
        firstName: editing.firstName || editing.name || '',
        name: editing.firstName || editing.name || '',
        lastName: editing.lastName ?? '',
        email: editing.email,
        rol: Number(editing.role ?? 3),
        password: editing.password ?? '',
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.message ?? 'Error al guardar el usuario')
        return
      }

      // Assign to institution if selected (only on create)
      if (isNew && editing.institutionId) {
        const body = await res.json().catch(() => ({}))
        const userId: string | undefined = body.userId
        if (userId) {
          await fetch(`${API.institutions}/${editing.institutionId}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          })
        }
      }

      clientCache.del(`users_p${page}`)
      setDialogOpen(false)
      await fetchUsers(page, true)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`${API.users}/${id}`, { method: 'DELETE' })
      clientCache.del(`users_p${page}`)
      await fetchUsers(page, true)
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const BACKEND_PAGE_SIZE = 20
  const totalPages = Math.max(1, Math.ceil(totalUsers / BACKEND_PAGE_SIZE))
  const pageUsers = users

  return (
    <div ref={container} className="flex flex-col gap-5">
      {/* Toolbar */}
      <section
        data-surface
        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-linear-to-r from-secondary/40 via-card/70 to-primary/5 px-5 py-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UsersIcon className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {totalUsers} user{totalUsers !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              Grant access by role: admin, manager, employee.
            </p>
          </div>
        </div>
        <Button
          className="cursor-pointer gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
          onClick={openCreate}
        >
          <PlusIcon className="size-4" />
          New User
        </Button>
      </section>

      {/* Table surface */}
      <section
        data-surface
        className="overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-xs uppercase tracking-wider">Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Email</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Role</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  No users yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              pageUsers.map((user) => {
                const roleKey = user.role ?? 'employee'
                return (
                  <TableRow
                    key={user.id}
                    data-row
                    className="border-border/40 transition-colors duration-150 ease-out hover:bg-secondary/40"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/15 to-teal/15 text-xs font-semibold text-primary">
                          {getInitials(user.firstName ?? "-")}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${roleStyles[String(user.role ?? '3')] ?? 'bg-muted/60 text-muted-foreground'}`}
                      >
                        {normalizeRole(user.role)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => openEdit(user)}
                          title="Edit"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmDelete(user)}
                          disabled={deletingId === user.id}
                          title="Delete"
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
            <p className="hidden text-sm text-muted-foreground lg:block">
              {(page - 1) * BACKEND_PAGE_SIZE + 1}–{Math.min(page * BACKEND_PAGE_SIZE, totalUsers)} of {totalUsers}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="hidden size-8 lg:flex cursor-pointer" disabled={page === 1} onClick={() => setPage(1)}>
                  <span className="sr-only">First page</span><ChevronsLeftIcon />
                </Button>
                <Button variant="outline" size="icon" className="size-8 cursor-pointer" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <span className="sr-only">Previous page</span><ChevronLeftIcon />
                </Button>
                <Button variant="outline" size="icon" className="size-8 cursor-pointer" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <span className="sr-only">Next page</span><ChevronRightIcon />
                </Button>
                <Button variant="outline" size="icon" className="hidden size-8 lg:flex cursor-pointer" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
                  <span className="sr-only">Last page</span><ChevronsRightIcon />
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Edit User' : 'New User'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-name">First Name *</Label>
              <Input
                id="user-name"
                value={editing.firstName ?? editing.name ?? ''}
                onChange={(e) => setEditing({ ...editing, firstName: e.target.value, name: e.target.value })}
                placeholder="Jane"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-lastname">Last Name</Label>
              <Input
                id="user-lastname"
                value={editing.lastName ?? ''}
                onChange={(e) => setEditing({ ...editing, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                placeholder="jane@company.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select
                value={editing.role ?? '3'}
                onValueChange={(v) => setEditing({ ...editing, role: v ?? undefined })}
              >
                <SelectTrigger>
                  <SelectValue>{ROLES[editing.role ?? '3'] ?? 'Student'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">SuperAdmin</SelectItem>
                  <SelectItem value="1">Admin</SelectItem>
                  <SelectItem value="2">Professor</SelectItem>
                  <SelectItem value="3">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editing.id && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-institution">Institution</Label>
                <Select
                  value={editing.institutionId ?? ''}
                  onValueChange={(v) => setEditing({ ...editing, institutionId: v ?? undefined })}
                >
                  <SelectTrigger id="user-institution">
                    <SelectValue placeholder="Select institution (optional)">
                      {editing.institutionId
                        ? institutions.find((i) => i.id === editing.institutionId)?.name ?? 'Select institution (optional)'
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-password">
                {editing.id ? 'New Password (leave blank to keep current)' : 'Password *'}
              </Label>
              <div className="relative">
                <Input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  value={editing.password ?? ''}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                  placeholder={editing.id ? '••••••••' : 'Min 8 characters'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOffIcon className="size-4" />
                    : <EyeIcon className="size-4" />}
                </button>
              </div>
            </div>
          </div>
          {saveError && (
            <p className="text-sm text-destructive px-1">{saveError}</p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>
              Cancel
            </DialogClose>
            <Button
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
              onClick={handleSave}
              disabled={saving || !(editing.firstName?.trim() || editing.name?.trim()) || !editing.email?.trim() || (!editing.id && !editing.password?.trim())}
            >
              {saving ? 'Saving…' : editing.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete user"
        description={`You are about to permanently delete the user "${confirmDelete?.name ?? ''}" (${confirmDelete?.email ?? ''}). This action cannot be undone and the user will lose access immediately.`}
        confirmLabel="Delete user"
        variant="destructive"
        loading={deletingId === confirmDelete?.id}
        onConfirm={async () => {
          if (confirmDelete) await handleDelete(confirmDelete.id)
        }}
      />
    </div>
  )
}
