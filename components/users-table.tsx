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
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from 'lucide-react'
import { API } from '@/lib/endpoints'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'
import { number } from 'zod'

gsap.registerPlugin(useGSAP)

interface User {
  firstName?: string
  id: string
  name: string
  email: string
  role?: string
}

const EMPTY: User = { id: '', name: '', email: '', role: 'employee' }

const roleStyles: Record<string, string> = {
  admin: 'bg-primary/12 text-primary',
  manager: 'bg-teal/15 text-teal',
  employee: 'bg-sage/40 text-forest',
}

function normalizeRole(role: number) {
  const key = role ?? 3
  let roleName: string;

  if (key === 0) roleName = 'SuperAdmin'
  else if (key === 1) roleName = 'Admin'
  else if (key === 2) roleName = 'Proffesor'
  else roleName = 'Student'
  
  return roleName
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User & { password?: string }>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API.users)
      if (!res.ok) return;
      const data = await res.json()
      console.log('Fetch users response:', data)
      setUsers(Array.isArray(data) ? data : data.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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
    setDialogOpen(true)
  }

  function openEdit(user: User) {
    setEditing({ ...user, password: '' })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const isNew = !editing.id
      const url = isNew ? API.users : `${API.users}/${editing.id}`
      const method = isNew ? 'POST' : 'PUT'
      const payload: Record<string, string | undefined> = {
        name: editing.name,
        email: editing.email,
        role: editing.role,
      }
      if (editing.password) payload.password = editing.password
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setDialogOpen(false)
        await fetchUsers()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`${API.users}/${id}`, { method: 'DELETE' })
      await fetchUsers()
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

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
              {users.length} user{users.length !== 1 ? 's' : ''}
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
              users.map((user) => {
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
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${roleStyles[roleKey] ?? 'bg-muted/60 text-muted-foreground'}`}
                      >
                        { normalizeRole(parseInt(user.role ?? "3")) ?? 'employee'}
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
      </section>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Edit User' : 'New User'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-name">Name *</Label>
              <Input
                id="user-name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Jane Doe"
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
                value={editing.role ?? 'employee'}
                onValueChange={(v) => setEditing({ ...editing, role: v ?? undefined })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-password">
                {editing.id ? 'New Password (leave blank to keep current)' : 'Password *'}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={editing.password ?? ''}
                onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                placeholder={editing.id ? '••••••••' : 'Min 8 characters'}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>
              Cancel
            </DialogClose>
            <Button
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
              onClick={handleSave}
              disabled={saving || !editing.firstName?.trim() || !editing.email.trim()}
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
