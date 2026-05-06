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
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingIcon,
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
  address?: string
  phone?: string
  contactEmail?: string
  timezone?: string
  createdAt?: string
}

interface InstitutionsResponse {
  institutions?: Institution[]
}

const EMPTY: Institution = { id: '', name: '', address: '', phone: '', contactEmail: '', timezone: 'Europe/Madrid' }
const PAGE_SIZE = 10

export function InstitutionsTable() {
  const container = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Institution>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Institution | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: raw, isLoading, mutate } = useSWR<Institution[] | InstitutionsResponse>(
    API.institutions,
    fetcher,
    { revalidateOnFocus: true },
  )

  const institutions: Institution[] = Array.isArray(raw)
    ? raw
    : (raw as InstitutionsResponse)?.institutions ?? []

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '[data-surface]',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: DURATION.entrance, ease: EASE.out, clearProps: 'opacity,transform' },
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
        { opacity: 1, y: 0, duration: DURATION.standard, ease: EASE.out, stagger: STAGGER.tight, clearProps: 'opacity,transform' },
      )
    },
    { scope: container, dependencies: [isLoading, institutions] },
  )

  function openCreate() {
    setEditing(EMPTY)
    setSaveError(null)
    setDialogOpen(true)
  }

  function openEdit(inst: Institution) {
    setEditing({ ...inst })
    setSaveError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const isNew = !editing.id
      const url = isNew ? API.institutions : `${API.institutions}/${editing.id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          address: editing.address ?? '',
          phone: editing.phone ?? '',
          contactEmail: editing.contactEmail ?? '',
          timezone: editing.timezone ?? 'Europe/Madrid',
        }),
      })
      if (res.ok) {
        setDialogOpen(false)
        await mutate()
      } else {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.message ?? 'Error al guardar la institución')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`${API.institutions}/${id}`, { method: 'DELETE' })
      await mutate()
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(institutions.length / PAGE_SIZE))
  const pageInstitutions = institutions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div ref={container} className="flex flex-col gap-5">
      {/* Toolbar */}
      <div data-surface className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/80 px-5 py-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <BuildingIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Institutions</p>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Loading…' : `${institutions.length} ${institutions.length === 1 ? 'institution' : 'institutions'}`}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          onClick={openCreate}
        >
          <PlusIcon className="size-4 mr-1.5" />
          New Institution
        </Button>
      </div>

      {/* Table */}
      <section data-surface className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="text-xs uppercase tracking-wider">Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wider hidden md:table-cell">Email</TableHead>
              <TableHead className="text-xs uppercase tracking-wider hidden lg:table-cell">Timezone</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : pageInstitutions.length === 0 ? (
              <TableRow className="border-border/40">
                <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                  No institutions yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              pageInstitutions.map((inst) => (
                <TableRow key={inst.id} data-row className="border-border/40 transition-colors duration-150 hover:bg-secondary/40">
                  <TableCell className="font-medium">{inst.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {inst.contactEmail || '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {inst.timezone || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(inst)}
                      >
                        <PencilIcon className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmDelete(inst)}
                        disabled={deletingId === inst.id}
                      >
                        <TrashIcon className="size-3.5" />
                        <span className="sr-only">Delete</span>
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
            <p className="hidden text-sm text-muted-foreground lg:block tabular-nums">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, institutions.length)} of {institutions.length}
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
            <DialogTitle>{editing.id ? 'Edit Institution' : 'New Institution'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="inst-name">Name *</Label>
              <Input
                id="inst-name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Escuela Nacional"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inst-address">Address</Label>
              <Input
                id="inst-address"
                value={editing.address ?? ''}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                placeholder="Carrer Exemple 123"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inst-phone">Phone</Label>
              <Input
                id="inst-phone"
                value={editing.phone ?? ''}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                placeholder="+34 934 567 890"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inst-email">Contact Email</Label>
              <Input
                id="inst-email"
                type="email"
                value={editing.contactEmail ?? ''}
                onChange={(e) => setEditing({ ...editing, contactEmail: e.target.value })}
                placeholder="admin@school.edu"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inst-timezone">Timezone</Label>
              <Input
                id="inst-timezone"
                value={editing.timezone ?? ''}
                onChange={(e) => setEditing({ ...editing, timezone: e.target.value })}
                placeholder="Europe/Madrid"
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
              disabled={saving || !editing.name.trim()}
            >
              {saving ? 'Saving…' : editing.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete institution"
        description={`You are about to permanently delete "${confirmDelete?.name ?? ''}". This action cannot be undone.`}
        confirmLabel="Delete institution"
        variant="destructive"
        loading={deletingId === confirmDelete?.id}
        onConfirm={async () => {
          if (confirmDelete) await handleDelete(confirmDelete.id)
        }}
      />
    </div>
  )
}
