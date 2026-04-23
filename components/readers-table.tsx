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
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  RefreshCwIcon,
  CpuIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'
import { API } from '@/lib/endpoints'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

interface Reader {
  id: string
  name: string
  location?: string
  institutionId?: string
  isActive?: boolean
  createdAt?: string
}

const EMPTY: Reader = { id: '', name: '', location: '', isActive: true }
const PAGE_SIZE = 10

export function ReadersTable() {
  const container = useRef<HTMLDivElement>(null)
  const [readers, setReaders] = useState<Reader[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Reader>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newKey, setNewKey] = useState<{ readerId: string; key: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Reader | null>(null)
  const [confirmRegenerate, setConfirmRegenerate] = useState<Reader | null>(null)

  useEffect(() => { setPage(1) }, [readers])

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

  useEffect(() => {
    fetchReaders()
  }, [fetchReaders])

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
    { scope: container, dependencies: [loading, readers] },
  )

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
        body: JSON.stringify({
          name: editing.name,
          location: editing.location,
          isActive: editing.isActive,
          institutionId: editing.institutionId, // for backward compatibility, remove in future
        }),
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
    setDeletingId(id)
    try {
      await fetch(`${API.readers}/${id}`, { method: 'DELETE' })
      await fetchReaders()
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  async function handleRegenerateKey(id: string) {
    setRegeneratingId(id)
    try {
      const res = await fetch(`${API.readers}/${id}/regenerate-key`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setNewKey({
          readerId: id,
          key: data.apiKey ?? data.key ?? '(check server response)',
        })
      }
    } finally {
      setRegeneratingId(null)
      setConfirmRegenerate(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(readers.length / PAGE_SIZE))
  const pageReaders = readers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div ref={container} className="flex flex-col gap-5">
      {/* Toolbar surface */}
      <section
        data-surface
        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-linear-to-r from-secondary/40 via-card/70 to-teal/5 px-5 py-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-teal/15 text-teal">
            <CpuIcon className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {readers.length} reader{readers.length !== 1 ? 's' : ''} configured
            </p>
            <p className="text-xs text-muted-foreground">
              Manage devices and their API keys.
            </p>
          </div>
        </div>
        <Button
          className="cursor-pointer gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
          onClick={openCreate}
        >
          <PlusIcon className="size-4" />
          New Reader
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
              <TableHead className="text-xs uppercase tracking-wider">Location</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Created</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : readers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No readers yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              pageReaders.map((reader) => (
                <TableRow
                  key={reader.id}
                  data-row
                  className="border-border/40 transition-colors duration-150 ease-out hover:bg-secondary/40"
                >
                  <TableCell className="font-medium">{reader.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {reader.location ?? '—'}
                  </TableCell>
                  <TableCell>
                    {reader.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-teal/15 px-2 py-0.5 text-xs font-medium text-teal">
                        <span className="size-1.5 rounded-full bg-teal" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {reader.createdAt ? new Date(reader.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer hover:bg-secondary"
                        onClick={() => openEdit(reader)}
                        title="Edit"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer hover:bg-secondary"
                        onClick={() => setConfirmRegenerate(reader)}
                        disabled={regeneratingId === reader.id}
                        title="Regenerate API key"
                      >
                        <RefreshCwIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDelete(reader)}
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
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
            <p className="hidden text-sm text-muted-foreground lg:block">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, readers.length)} of {readers.length}
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="reader-name">Institution ID</Label>
              <Input
                id="institution-id"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, institutionId: e.target.value })}
                placeholder="Institution ID"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="reader-active"
                type="checkbox"
                checked={editing.isActive ?? true}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                className="accent-teal cursor-pointer"
              />
              <Label htmlFor="reader-active" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>
              Cancel
            </DialogClose>
            <Button
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
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
          <code className="block rounded-md border border-border/60 bg-secondary/50 p-3 text-sm font-mono break-all">
            {newKey?.key}
          </code>
          <DialogFooter>
            <Button
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
              onClick={() => {
                navigator.clipboard.writeText(newKey?.key ?? '')
                setNewKey(null)
              }}
            >
              Copy &amp; Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete reader confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete reader"
        description={`You are about to permanently delete the reader "${confirmDelete?.name ?? ''}". This action cannot be undone and the device will lose access immediately.`}
        confirmLabel="Delete reader"
        variant="destructive"
        loading={deletingId === confirmDelete?.id}
        onConfirm={async () => {
          if (confirmDelete) await handleDelete(confirmDelete.id)
        }}
      />

      {/* Regenerate API key confirmation */}
      <ConfirmDialog
        open={!!confirmRegenerate}
        onOpenChange={(open) => !open && setConfirmRegenerate(null)}
        title="Regenerate API key"
        description={`You are about to regenerate the API key for "${confirmRegenerate?.name ?? ''}". The current key will stop working immediately and any device using it will lose connectivity until updated.`}
        confirmLabel="Regenerate key"
        variant="destructive"
        loading={regeneratingId === confirmRegenerate?.id}
        onConfirm={async () => {
          if (confirmRegenerate) await handleRegenerateKey(confirmRegenerate.id)
        }}
      />
    </div>
  )
}
