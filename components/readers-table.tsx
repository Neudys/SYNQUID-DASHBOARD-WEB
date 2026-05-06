'use client'

import { useRef, useState } from 'react'
import useSWR from 'swr'
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
import { fetcher } from '@/lib/fetcher'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

interface Institution {
  id: string
  name: string
}

interface Reader {
  id: string
  name: string
  location?: string
  institutionId?: string
  firmwareVersion?: string
  isActive?: boolean
  createdAt?: string
}

const EMPTY: Reader = { id: '', name: '', location: '', institutionId: '', firmwareVersion: '', isActive: true }
const PAGE_SIZE = 10

export function ReadersTable() {
  const container = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Reader>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newKey, setNewKey] = useState<{ readerId: string; key: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Reader | null>(null)
  const [confirmRegenerate, setConfirmRegenerate] = useState<Reader | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: readersRaw, isLoading, mutate } = useSWR<Reader[] | { items?: Reader[] }>(
    API.readers,
    fetcher,
    { revalidateOnFocus: true },
  )

  const { data: institutionsRaw } = useSWR<Institution[] | { institutions?: Institution[] }>(
    API.institutions,
    fetcher,
    { revalidateOnFocus: true },
  )

  const readers: Reader[] = Array.isArray(readersRaw)
    ? readersRaw
    : (readersRaw as { items?: Reader[] })?.items ?? []

  const institutions: Institution[] = Array.isArray(institutionsRaw)
    ? institutionsRaw
    : (institutionsRaw as { institutions?: Institution[] })?.institutions ?? []

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
      if (prefersReducedMotion() || isLoading) return
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
    { scope: container, dependencies: [isLoading, readers] },
  )

  function openCreate() {
    setEditing(EMPTY)
    setSaveError(null)
    setDialogOpen(true)
  }

  function openEdit(reader: Reader) {
    setEditing({ ...reader })
    setSaveError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const isNew = !editing.id
      const url = isNew ? API.readers : `${API.readers}/${editing.id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          location: editing.location ?? '',
          institutionId: editing.institutionId ?? '',
          FirmwareVersion: editing.firmwareVersion ?? '',
          CpuTemp: 0,
          MemoryUsageMb: 0,
        }),
      })
      if (res.ok) {
        setDialogOpen(false)
        await mutate()
      } else {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.message ?? 'Error al guardar el dispositivo')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`${API.readers}/${id}`, { method: 'DELETE' })
      await mutate()
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
        await mutate()
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
            {isLoading ? (
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
        {!isLoading && totalPages > 1 && (
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
              <Label htmlFor="institution-id">Institution *</Label>
              <Select
                value={editing.institutionId ?? ''}
                onValueChange={(v) => setEditing({ ...editing, institutionId: v ?? undefined })}
              >
                <SelectTrigger id="institution-id">
                  <SelectValue placeholder="Select institution…">
                    {editing.institutionId
                      ? institutions.find((i) => i.id === editing.institutionId)?.name ?? 'Select institution…'
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="reader-firmware">Firmware Version</Label>
              <Input
                id="reader-firmware"
                value={editing.firmwareVersion ?? ''}
                onChange={(e) => setEditing({ ...editing, firmwareVersion: e.target.value })}
                placeholder="1.0.0"
              />
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
              disabled={saving || !editing.name.trim() || !editing.institutionId?.trim()}
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
