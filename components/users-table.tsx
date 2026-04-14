'use client'

import { useCallback, useEffect, useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
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
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react'
import { API } from '@/lib/endpoints'

interface User {
  id: string
  name: string
  email: string
  role?: string
}

const EMPTY: User = { id: '', name: '', email: '', role: 'employee' }

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User & { password?: string }>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API.users)
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : data.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

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
    if (!confirm('Delete this user? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await fetch(`${API.users}/${id}`, { method: 'DELETE' })
      await fetchUsers()
    } finally {
      setDeletingId(null)
    }
  }

  const roleColor: Record<string, string> = {
    admin: 'bg-forest/15 text-forest border-0',
    manager: 'bg-sage/60 text-ink border-0',
    employee: 'bg-muted text-muted-foreground border-0',
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} user{users.length !== 1 ? 's' : ''}
        </p>
        <Button
          className="bg-forest hover:bg-forest/90 text-cream gap-2"
          onClick={openCreate}
        >
          <PlusIcon className="size-4" />
          New User
        </Button>
      </div>

      <div className="rounded-lg border border-sage overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground text-sm">
                  No users found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={roleColor[user.role?.toLowerCase() ?? 'employee'] ?? 'bg-muted text-muted-foreground border-0'}
                    >
                      {user.role ?? 'employee'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(user)}
                        title="Edit"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingId === user.id}
                        title="Delete"
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              className="bg-forest hover:bg-forest/90 text-cream"
              onClick={handleSave}
              disabled={saving || !editing.name.trim() || !editing.email.trim()}
            >
              {saving ? 'Saving…' : editing.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
