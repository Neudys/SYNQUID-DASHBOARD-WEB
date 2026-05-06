'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { Card, CardContent } from '@/components/ui/card'
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
  CreditCardIcon,
  SearchIcon,
  CheckIcon,
  UserIcon,
  MailIcon,
  Building2Icon,
  CircleCheckIcon,
  CircleSlashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  type LucideIcon,
} from 'lucide-react'
import { API } from '@/lib/endpoints'
import { fetcher } from '@/lib/fetcher'
import { cn } from '@/lib/utils'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

interface RawInstitution {
  id?: string
  name?: string
}

interface RawUser {
  id?: string
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  role?: number
  institutionId?: string | null
  institution?: RawInstitution | null
}

interface RawNfc {
  id: string
  userId?: string | null
  hashUid?: string
  cardType?: number
  isActive?: boolean
  revokedAt?: string | null
  createdAt?: string
  user?: RawUser | null
  institution?: RawInstitution | null
}

interface NfcCard {
  id: string
  userId: string | null
  hashUid: string
  cardType: number
  isActive: boolean
  createdAt?: string
  revokedAt?: string | null
  firstName?: string
  lastName?: string
  email?: string
  institutionId: string | null
  institutionName?: string
}

interface UserOption {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  email: string
  role?: number
  institutionId?: string | null
}

function displayName(u: Pick<UserOption, 'firstName' | 'lastName' | 'name'> & { email?: string }) {
  if (u.firstName || u.lastName) return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
  return u.name ?? u.email ?? '—'
}

const cardTypeLabels: Record<number, string> = {
  0: 'Physical',
  1: 'HCE',
  2: 'Virtual',
}

function parseCard(c: RawNfc): NfcCard {
  const userName = c.user?.name ?? [c.user?.firstName, c.user?.lastName].filter(Boolean).join(' ') ?? undefined
  const [firstName, ...rest] = userName?.split(' ') ?? []
  const lastName = rest.join(' ') || undefined
  return {
    id: c.id,
    userId: c.userId ?? null,
    hashUid: c.hashUid ?? '',
    cardType: c.cardType ?? 0,
    isActive: c.isActive ?? true,
    createdAt: c.createdAt,
    revokedAt: c.revokedAt ?? null,
    firstName: firstName || undefined,
    lastName: lastName,
    email: c.user?.email,
    institutionId: c.institution?.id ?? c.user?.institutionId ?? c.user?.institution?.id ?? null,
    institutionName: c.institution?.name ?? c.user?.institution?.name,
  }
}

const PAGE_SIZE = 10

export function NfcTable() {
  const container = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignUuid, setAssignUuid] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)
  const [saving, setSaving] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const [students, setStudents] = useState<UserOption[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')

  const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<NfcCard | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState<NfcCard | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: nfcRaw, isLoading, mutate } = useSWR<RawNfc[] | { items?: RawNfc[] }>(
    API.nfc,
    fetcher,
    { revalidateOnFocus: true },
  )

  const rawList: RawNfc[] = Array.isArray(nfcRaw)
    ? nfcRaw
    : (nfcRaw as { items?: RawNfc[] })?.items ?? []

  const cards: NfcCard[] = useMemo(() => rawList.map(parseCard), [rawList])

  useEffect(() => {
    fetch(API.auth.me)
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (!u) return
        const raw = u.userData ?? u
        setCurrentInstitutionId(raw.institutionId ?? raw.InstitutionId ?? null)
      })
      .catch(() => {})
  }, [])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '[data-stat-card]',
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.entrance,
          ease: EASE.out,
          stagger: STAGGER.loose,
          clearProps: 'opacity,transform',
        },
      )
      gsap.fromTo(
        '[data-surface]',
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.entrance,
          ease: EASE.out,
          clearProps: 'opacity,transform',
          delay: 0.05,
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
    { scope: container, dependencies: [isLoading, cards] },
  )

  const stats = useMemo(() => {
    const total = cards.length
    const active = cards.filter((c) => c.isActive).length
    const inactive = total - active
    const institutions = new Set(
      cards.map((c) => c.institutionId).filter((v): v is string => !!v),
    ).size
    return { total, active, inactive, institutions }
  }, [cards])

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => {
      const n = displayName(s).toLowerCase()
      return n.includes(q) || s.email.toLowerCase().includes(q)
    })
  }, [students, studentSearch])

  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true)
    try {
      const res = await fetch(API.users)
      if (res.ok) {
        const data = await res.json()
        const list: UserOption[] = Array.isArray(data) ? data : data.items ?? data.users ?? []
        setStudents(list)
      } else {
        setStudents([])
      }
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  function openAssign() {
    setAssignUuid('')
    setSelectedUser(null)
    setStudentSearch('')
    setAssignError(null)
    setAssignOpen(true)
    fetchStudents()
  }

  function openEdit(card: NfcCard) {
    setEditing({ ...card })
    setEditOpen(true)
    setStudentSearch('')
    if (students.length === 0) fetchStudents()
  }

  async function handleAssign() {
    if (!assignUuid.trim() || !selectedUser) return
    setSaving(true)
    setAssignError(null)
    try {
      const res = await fetch(API.nfcAssign, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: assignUuid.trim(),
          name: displayName(selectedUser),
          email: selectedUser.email,
          institutionId: selectedUser.institutionId ?? currentInstitutionId ?? '',
        }),
      })
      if (res.ok) {
        setAssignOpen(false)
        await mutate()
      } else {
        const data = await res.json().catch(() => ({}))
        setAssignError(data.message ?? 'Failed to assign card')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleEditSave() {
    if (!editing) return
    setEditSaving(true)
    try {
      const res = await fetch(`${API.nfc}/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editing.userId ?? '',
          isActive: editing.isActive,
        }),
      })
      if (res.ok) {
        setEditOpen(false)
        await mutate()
      }
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`${API.nfc}/${id}`, { method: 'DELETE' })
      await mutate()
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE))
  const pageCards = cards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div ref={container} className="flex flex-col gap-6">
      <StatsGrid
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
        institutions={stats.institutions}
      />

      {/* Toolbar */}
      <section
        data-surface
        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-linear-to-r from-secondary/40 via-card/70 to-teal/5 px-5 py-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-teal/15 text-teal">
            <CreditCardIcon className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {cards.length} NFC card{cards.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              Assign cards to students and manage access.
            </p>
          </div>
        </div>
        <Button
          className="cursor-pointer gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
          onClick={openAssign}
        >
          <PlusIcon className="size-4" />
          Assign Card
        </Button>
      </section>

      {/* Table */}
      <section
        data-surface
        className="overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-xs uppercase tracking-wider">Student</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Institution</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Created</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : cards.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No NFC cards yet. Assign one to get started.
                </TableCell>
              </TableRow>
            ) : (
              pageCards.map((card) => {
                const name = displayName(card)
                return (
                  <TableRow
                    key={card.id}
                    data-row
                    className="border-border/40 transition-colors duration-150 ease-out hover:bg-secondary/40"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{name}</span>
                        {card.email && (
                          <span className="text-xs text-muted-foreground">{card.email}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {card.institutionName ?? '—'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/60 px-2 py-0.5 text-xs font-medium text-foreground">
                        {cardTypeLabels[card.cardType] ?? `Type ${card.cardType}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      {card.isActive ? (
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
                      {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => openEdit(card)}
                          title="Edit"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmDelete(card)}
                          disabled={deletingId === card.id}
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
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
            <p className="hidden text-sm text-muted-foreground lg:block">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, cards.length)} of {cards.length}
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

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign NFC Card</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nfc-uuid">Card UUID *</Label>
              <Input
                id="nfc-uuid"
                value={assignUuid}
                onChange={(e) => setAssignUuid(e.target.value)}
                placeholder="e.g. 04:A2:B5:1C:8F:3E"
                className="font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Student *</Label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="pl-9"
                />
              </div>
              <div className="max-h-80 overflow-y-auto rounded-lg border border-border/60 bg-popover">
                {studentsLoading ? (
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No students found.
                  </p>
                ) : (
                  <ul>
                    {filteredStudents.map((s) => {
                      const active = selectedUser?.id === s.id
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedUser(s)}
                            className={cn(
                              'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-secondary/60',
                              active && 'bg-teal/10 hover:bg-teal/15',
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-foreground">
                                {displayName(s)}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {s.email}
                              </p>
                            </div>
                            {active && <CheckIcon className="size-4 shrink-0 text-teal" />}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {selectedUser && (
                <div className="rounded-lg border border-border/60 bg-secondary/40 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium text-foreground">{displayName(selectedUser)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MailIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-foreground">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2Icon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Institution:</span>
                    <span className="font-mono text-foreground">
                      {selectedUser.institutionId ?? currentInstitutionId ?? '—'}
                    </span>
                    {!selectedUser.institutionId && currentInstitutionId && (
                      <span className="ml-1 rounded-sm bg-muted/60 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        from your account
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {assignError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                {assignError}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>
              Cancel
            </DialogClose>
            <Button
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
              onClick={handleAssign}
              disabled={saving || !assignUuid.trim() || !selectedUser}
            >
              {saving ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit NFC Card</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="flex flex-col gap-4 py-2">
              <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Current student:</span>
                  <span className="font-medium text-foreground">
                    {displayName(editing)}
                  </span>
                </div>
                {editing.institutionName && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Institution:</span>
                    <span className="text-foreground">{editing.institutionName}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label>Reassign to student</Label>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="pl-9"
                  />
                </div>
                <div className="max-h-80 overflow-y-auto rounded-lg border border-border/60 bg-popover">
                  {studentsLoading ? (
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No students found.
                    </p>
                  ) : (
                    <ul>
                      {filteredStudents.map((s) => {
                        const active = editing.userId === s.id
                        return (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() =>
                                setEditing({
                                  ...editing,
                                  userId: s.id,
                                  firstName: s.firstName,
                                  lastName: s.lastName,
                                  email: s.email,
                                })
                              }
                              className={cn(
                                'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-secondary/60',
                                active && 'bg-teal/10 hover:bg-teal/15',
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-foreground">
                                  {displayName(s)}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {s.email}
                                </p>
                              </div>
                              {active && <CheckIcon className="size-4 shrink-0 text-teal" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="edit-active"
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  className="accent-teal cursor-pointer size-4"
                />
                <Label htmlFor="edit-active" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>
              Cancel
            </DialogClose>
            <Button
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
              onClick={handleEditSave}
              disabled={editSaving || !editing?.userId}
            >
              {editSaving ? 'Saving…' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete NFC card"
        description={`You are about to permanently delete the card assigned to "${displayName(confirmDelete ?? {})}". This action cannot be undone.`}
        confirmLabel="Delete card"
        variant="destructive"
        loading={deletingId === confirmDelete?.id}
        onConfirm={async () => {
          if (confirmDelete) await handleDelete(confirmDelete.id)
        }}
      />
    </div>
  )
}

/* ------------------------------ Stats ------------------------------ */

type Accent = 'forest' | 'teal' | 'sage' | 'moss'

interface Stat {
  label: string
  value: string | number
  icon: LucideIcon
  description: string
  accent: Accent
}

const accentMap: Record<Accent, { bg: string; text: string; ring: string }> = {
  forest: { bg: 'bg-primary/10', text: 'text-primary', ring: 'group-hover:ring-primary/30' },
  teal: { bg: 'bg-teal/15', text: 'text-teal', ring: 'group-hover:ring-teal/40' },
  sage: {
    bg: 'bg-sage/40 dark:bg-sage/15',
    text: 'text-forest dark:text-sage',
    ring: 'group-hover:ring-sage/60',
  },
  moss: { bg: 'bg-moss/15', text: 'text-moss', ring: 'group-hover:ring-moss/40' },
}

function StatsGrid({
  total,
  active,
  inactive,
  institutions,
}: {
  total: number
  active: number
  inactive: number
  institutions: number
}) {
  const stats: Stat[] = [
    {
      label: 'Total Cards',
      value: total,
      icon: CreditCardIcon,
      description: 'Registered in the system',
      accent: 'forest',
    },
    {
      label: 'Active',
      value: active,
      icon: CircleCheckIcon,
      description: 'Currently enabled',
      accent: 'teal',
    },
    {
      label: 'Inactive',
      value: inactive,
      icon: CircleSlashIcon,
      description: 'Revoked or disabled',
      accent: 'moss',
    },
    {
      label: 'Institutions',
      value: institutions,
      icon: Building2Icon,
      description: 'With issued cards',
      accent: 'sage',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const accent = accentMap[stat.accent]
        return (
          <Card
            key={stat.label}
            data-stat-card
            className={cn(
              'group relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm ring-1 ring-transparent transition-all duration-250 ease-out hover:-translate-y-0.5 hover:shadow-md',
              accent.ring,
            )}
          >
            <div
              className={cn(
                'absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-current to-transparent opacity-30',
                accent.text,
              )}
            />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ease-out',
                    accent.bg,
                    accent.text,
                  )}
                >
                  <stat.icon className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
