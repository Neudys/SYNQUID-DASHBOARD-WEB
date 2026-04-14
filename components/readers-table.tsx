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
  PlusIcon,
  PencilIcon,
  TrashIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { API } from '@/lib/endpoints'

interface Reader {
  id: string
  name: string
  location?: string
  isActive?: boolean
  createdAt?: string
}

const EMPTY: Reader = { id: '', name: '', location: '', isActive: true }

export function ReadersTable() {
  const [readers, setReaders] = useState<Reader[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Reader>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newKey, setNewKey] = useState<{ readerId: string; key: string } | null>(null)

  const fetchReaders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API.readers)
      const data = await res.json()
      setReaders(Array.isArray(data) ? data : data.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReaders() }, [fetchReaders])

  function openCreate() {
    setEditing(EMPTY)
    setDialogOpen(true)
  }

  function openEdit(reader: Reader) {
    setEditing({ ...reader })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const isNew = !editing.id
      const url = isNew ? API.readers : `${API.readers}/${editing.id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editing.name, location: editing.location, isActive: editing.isActive }),
      })
      if (res.ok) {
        setDialogOpen(false)
        await fetchReaders()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reader? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await fetch(`${API.readers}/${id}`, { method: 'DELETE' })
      await fetchReaders()
    } finally {
      setDeletingId(null)
    }
  }

  async function handleRegenerateKey(id: string) {
    if (!confirm('Regenerate API key? The old key will stop working immediately.')) return
    setRegeneratingId(id)
    try {
      const res = await fetch(`${API.readers}/${id}/regenerate-key`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setNewKey({ readerId: id, key: data.apiKey ?? data.key ?? '(check server response)' })
      }
    } finally {
      setRegeneratingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {readers.length} reader{readers.length !== 1 ? 's' : ''} configured
        </p>
        <Button
          className="bg-forest hover:bg-forest/90 text-cream gap-2"
          onClick={openCreate}
        >
          <PlusIcon className="size-4" />
          New Reader
        </Button>
      </div>

      <div className="rounded-lg border border-sage overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : readers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground text-sm">
                  No readers found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              readers.map((reader) => (
                <TableRow key={reader.id}>
                  <TableCell className="font-medium">{reader.name}</TableCell>
                  <TableCell className="text-muted-foreground">{reader.location ?? '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={reader.isActive ? 'default' : 'secondary'}
                      className={reader.isActive
                        ? 'bg-forest/15 text-forest border-0'
                        : 'bg-sage/30 text-muted-foreground border-0'}
                    >
                      {reader.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {reader.createdAt ? new Date(reader.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(reader)}
                        title="Edit"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateKey(reader.id)}
                        disabled={regeneratingId === reader.id}
                        title="Regenerate API key"
                      >
                        <RefreshCwIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(reader.id)}
                        disabled={deletingId === reader.id}
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
            <DialogTitle>{editing.id ? 'Edit Reader' : 'New Reader'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reader-name">Name *</Label>
              <Input
                id="reader-name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Main Entrance"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reader-location">Location</Label>
              <Input
                id="reader-location"
                value={editing.location ?? ''}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                placeholder="Building A, Floor 1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="reader-active"
                type="checkbox"
                checked={editing.isActive ?? true}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                className="accent-forest"
              />
              <Label htmlFor="reader-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              className="bg-forest hover:bg-forest/90 text-cream"
              onClick={handleSave}
              disabled={saving || !editing.name.trim()}
            >
              {saving ? 'Saving…' : editing.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New API Key Dialog */}
      <Dialog open={!!newKey} onOpenChange={() => setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New API Key Generated</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Copy this key now — it will not be shown again.
          </p>
          <code className="block rounded bg-muted p-3 text-sm font-mono break-all">
            {newKey?.key}
          </code>
          <DialogFooter>
            <Button
              className="bg-forest hover:bg-forest/90 text-cream"
              onClick={() => {
                navigator.clipboard.writeText(newKey?.key ?? '')
                setNewKey(null)
              }}
            >
              Copy & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
