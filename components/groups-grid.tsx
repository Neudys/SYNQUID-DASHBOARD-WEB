'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
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
  UsersIcon,
  BookOpenIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  GraduationCapIcon,
} from 'lucide-react'
import { API } from '@/lib/endpoints'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'
import { clientCache } from '@/lib/client-cache'

gsap.registerPlugin(useGSAP)

interface Group {
  id: string
  name: string
  level?: string
  institutionId?: string
  institutionName?: string
  professorId?: string
  professorName?: string
  memberCount?: number
  createdAt?: string
}

interface Member {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string | number
  Role?: string | number
}

interface Institution {
  id: string
  name: string
}

interface UserOption {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string | number
  Role?: string | number
}

const EMPTY: Partial<Group> = { id: '', name: '', level: '', institutionId: '', professorId: '' }
const PAGE_SIZE = 9

const LEVEL_COLORS: Record<string, string> = {
  default: 'bg-primary/10 text-primary',
}

function levelColor(level?: string): string {
  if (!level) return LEVEL_COLORS.default
  const h = level.charCodeAt(0) % 4
  const colors = [
    'bg-teal/15 text-teal',
    'bg-primary/10 text-primary',
    'bg-sage/40 text-forest dark:bg-sage/15 dark:text-sage',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ]
  return colors[h]
}

function displayName(u: Pick<UserOption, 'name' | 'firstName' | 'lastName'>): string {
  if (u.firstName || u.lastName) return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
  return u.name || '—'
}

export function GroupsGrid() {
  const container = useRef<HTMLDivElement>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [institutionFilter, setInstitutionFilter] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Group>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Group | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [membersOpen, setMembersOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [addUserId, setAddUserId] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [users, setUsers] = useState<UserOption[]>([])

  // ─── Data loading ────────────────────────────────────────────────────────────

  const fetchGroups = useCallback(async (force = false) => {
    const cached = clientCache.get<Group[]>('groups')
    if (cached && !force) {
      setGroups(cached)
      setLoading(false)
    } else if (!cached) {
      setLoading(true)
    }
    
    try {
      const res = await fetch(`${API.groups}?page=1&limit=1000`)
      if (!res.ok) return
      const data = await res.json()
      const list: Group[] = Array.isArray(data) ? data : data.groups ?? data.items ?? []
      clientCache.set('groups', list)
      setGroups(list)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  useEffect(() => {
    const cached = clientCache.get<Institution[]>('institutions')
    if (cached) { setInstitutions(cached) }
    fetch(API.institutions)
      .then(r => r.json())
      .then(data => {
        const list: Institution[] = Array.isArray(data) ? data : data.institutions ?? []
        clientCache.set('institutions', list)
        setInstitutions(list)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const cached = clientCache.get<UserOption[]>('users')
    if (cached) { setUsers(cached) }
    fetch(API.users)
      .then(r => r.json())
      .then(data => {
        const list: UserOption[] = Array.isArray(data) ? data : data.users ?? []
        clientCache.set('users', list)
        setUsers(list)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { setPage(1) }, [groups, institutionFilter])

  // ─── GSAP ────────────────────────────────────────────────────────────────────

  useGSAP(
    () => {
      if (prefersReducedMotion() || loading) return
      gsap.fromTo(
        '[data-group-card]',
        { opacity: 0, y: 12, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: DURATION.standard, ease: EASE.out, stagger: STAGGER.tight, clearProps: 'opacity,transform' },
      )
    },
    { scope: container, dependencies: [loading, groups] },
  )

  // ─── Computed ────────────────────────────────────────────────────────────────

  const professors = users.filter(u => {
    const role = u.Role ?? u.role
    const r = String(role ?? '').toLowerCase()
    return r === '2' || r === 'professor'
  })

  const filteredGroups = institutionFilter
    ? groups.filter(g => g.institutionId === institutionFilter)
    : groups

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE))
  const pageGroups = filteredGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const memberIds = new Set(members.map(m => m.id))
  const availableToAdd = users.filter(u => !memberIds.has(u.id))

  // ─── Group CRUD ──────────────────────────────────────────────────────────────

  function openCreate() {
    setEditing(EMPTY)
    setSaveError(null)
    setFormOpen(true)
  }

  function openEdit(group: Group) {
    setEditing({ ...group })
    setSaveError(null)
    setFormOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const isNew = !editing.id
      const url = isNew ? API.groups : `${API.groups}/${editing.id}`
      const method = isNew ? 'POST' : 'PUT'
      const payload = {
        name: editing.name,
        level: editing.level || null,
        institutionId: editing.institutionId,
        professorId: editing.professorId,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        clientCache.del('groups')
        setFormOpen(false)
        await fetchGroups(true)
      } else {
        const text = await res.text().catch(() => '')
        let data: { message?: string; backendError?: unknown } = {}
        try { if (text) data = JSON.parse(text) } catch { if (text) data = { message: text } }
        setSaveError(data.message ?? 'Error al guardar el grupo')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`${API.groups}/${id}`, { method: 'DELETE' })
      clientCache.del('groups')
      await fetchGroups(true)
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  // ─── Member management ───────────────────────────────────────────────────────

  async function openMembers(group: Group) {
    setSelectedGroup(group)
    setAddUserId('')
    setMemberError(null)
    setMembersOpen(true)
    setMembersLoading(true)
    try {
      const res = await fetch(`${API.groups}/${group.id}/members?page=1&limit=1000`)
      if (!res.ok) return
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : data.members ?? data.items ?? [])
    } finally {
      setMembersLoading(false)
    }
  }

  async function handleAddMember() {
    if (!selectedGroup || !addUserId) return
    setAddingMember(true)
    setMemberError(null)
    try {
      const res = await fetch(`${API.groups}/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: addUserId }),
      })
      if (res.ok) {
        setAddUserId('')
        // Refresh members list
        const r2 = await fetch(`${API.groups}/${selectedGroup.id}/members?page=1&limit=1000`)
        if (r2.ok) {
          const data = await r2.json()
          setMembers(Array.isArray(data) ? data : data.members ?? data.items ?? [])
        }
        clientCache.del('groups')
        await fetchGroups(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setMemberError(data.message ?? 'Error al agregar miembro')
      }
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!selectedGroup) return
    setRemovingId(userId)
    try {
      await fetch(`${API.groups}/${selectedGroup.id}/members/${userId}`, { method: 'DELETE' })
      setMembers(prev => prev.filter(m => m.id !== userId))
      clientCache.del('groups')
      await fetchGroups(true)
    } finally {
      setRemovingId(null)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div ref={container} className="flex flex-col gap-5">

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-card/80 px-5 py-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <BookOpenIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Groups</p>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading…' : `${filteredGroups.length} ${filteredGroups.length === 1 ? 'group' : 'groups'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {institutions.length > 0 && (
            <Select
              value={institutionFilter}
              onValueChange={(v) => setInstitutionFilter(v ?? '')}
            >
              <SelectTrigger className="w-48 bg-background/80">
                <SelectValue placeholder="All institutions">
                  {institutionFilter
                    ? institutions.find(i => i.id === institutionFilter)?.name ?? 'All institutions'
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All institutions</SelectItem>
                {institutions.map(inst => (
                  <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size="sm"
            className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={openCreate}
          >
            <PlusIcon className="size-4 mr-1.5" />
            New Group
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card/80 p-5 flex flex-col gap-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : pageGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center">
          <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
            <GraduationCapIcon className="size-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">No groups yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create a group to start managing classes.</p>
          <Button size="sm" className="mt-4 cursor-pointer" onClick={openCreate}>
            <PlusIcon className="size-4 mr-1.5" /> New Group
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageGroups.map((group) => {
            const instName = group.institutionName ?? institutions.find(i => i.id === group.institutionId)?.name
            const profName = group.professorName ?? displayName(professors.find(p => p.id === group.professorId) ?? { name: '' })
            return (
              <div
                key={group.id}
                data-group-card
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm transition-colors duration-150 hover:border-primary/40 hover:bg-card"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground leading-tight line-clamp-2">{group.name}</h3>
                  {group.level && (
                    <span className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${levelColor(group.level)}`}>
                      {group.level}
                    </span>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  {instName && (
                    <span className="flex items-center gap-1.5">
                      <BookOpenIcon className="size-3 shrink-0" />
                      {instName}
                    </span>
                  )}
                  {profName && profName !== '—' && (
                    <span className="flex items-center gap-1.5">
                      <GraduationCapIcon className="size-3 shrink-0" />
                      {profName}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <UsersIcon className="size-3 shrink-0" />
                    {group.memberCount ?? '—'} estudiantes
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-1 mt-auto border-t border-border/40">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(group)}
                  >
                    <PencilIcon className="size-3.5" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDelete(group)}
                    disabled={deletingId === group.id}
                  >
                    <TrashIcon className="size-3.5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto cursor-pointer gap-1.5 text-xs"
                    onClick={() => openMembers(group)}
                  >
                    <UsersIcon className="size-3.5" />
                    Members
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 px-4 py-3">
          <p className="hidden text-sm text-muted-foreground lg:block tabular-nums">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredGroups.length)} of {filteredGroups.length}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="hidden size-8 lg:flex cursor-pointer" disabled={page === 1} onClick={() => setPage(1)}>
                <span className="sr-only">First</span><ChevronsLeftIcon />
              </Button>
              <Button variant="outline" size="icon" className="size-8 cursor-pointer" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <span className="sr-only">Previous</span><ChevronLeftIcon />
              </Button>
              <Button variant="outline" size="icon" className="size-8 cursor-pointer" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <span className="sr-only">Next</span><ChevronRightIcon />
              </Button>
              <Button variant="outline" size="icon" className="hidden size-8 lg:flex cursor-pointer" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
                <span className="sr-only">Last</span><ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit dialog ─────────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Edit Group' : 'New Group'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-name">Name *</Label>
              <Input
                id="group-name"
                value={editing.name ?? ''}
                onChange={e => setEditing({ ...editing, name: e.target.value })}
                placeholder="Mathematics 5th"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-level">Level</Label>
              <Input
                id="group-level"
                value={editing.level ?? ''}
                onChange={e => setEditing({ ...editing, level: e.target.value })}
                placeholder="5th grade"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-institution">Institution *</Label>
              <Select
                value={editing.institutionId ?? ''}
                onValueChange={v => setEditing({ ...editing, institutionId: v ?? undefined })}
              >
                <SelectTrigger id="group-institution">
                  <SelectValue placeholder="Select institution…">
                    {editing.institutionId
                      ? institutions.find(i => i.id === editing.institutionId)?.name ?? 'Select institution…'
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {institutions.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-professor">Professor *</Label>
              <Select
                value={editing.professorId ?? ''}
                onValueChange={v => setEditing({ ...editing, professorId: v ?? undefined })}
              >
                <SelectTrigger id="group-professor">
                  <SelectValue placeholder="Select professor…">
                    {editing.professorId
                      ? displayName(professors.find(p => p.id === editing.professorId) ?? { name: '' }) || 'Select professor…'
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {professors.map(p => (
                    <SelectItem key={p.id} value={p.id}>{displayName(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {saveError && <p className="text-sm text-destructive px-1">{saveError}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>Cancel</DialogClose>
            <Button
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150"
              onClick={handleSave}
              disabled={saving || !editing.name?.trim() || !editing.professorId || (!editing.id && !editing.institutionId)}
            >
              {saving ? 'Saving…' : editing.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Members dialog ───────────────────────────────────────────────────── */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon className="size-4" />
              {selectedGroup?.name}
              {!membersLoading && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  — {members.length} estudiante{members.length !== 1 ? 's' : ''}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Add member row */}
          <div className="flex gap-2 pt-1">
            <Select
              value={addUserId}
              onValueChange={v => { setAddUserId(v ?? ''); setMemberError(null) }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select user to add…">
                  {addUserId
                    ? displayName(availableToAdd.find(u => u.id === addUserId) ?? { name: '' }) || 'Select user to add…'
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.length === 0 ? (
                  <SelectItem value="__none" disabled>No users available</SelectItem>
                ) : (
                  availableToAdd.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {displayName(u)}
                      {u.email && <span className="ml-1.5 text-xs text-muted-foreground">{u.email}</span>}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="cursor-pointer shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleAddMember}
              disabled={!addUserId || addingMember}
            >
              <UserPlusIcon className="size-4 mr-1" />
              {addingMember ? 'Adding…' : 'Add'}
            </Button>
          </div>
          {memberError && <p className="text-sm text-destructive px-1">{memberError}</p>}

          {/* Members list */}
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto rounded-lg border border-border/60 bg-secondary/20 p-1">
            {membersLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-md px-3 py-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-7 w-7 rounded" />
                </div>
              ))
            ) : members.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No members yet.</p>
            ) : (
              members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-secondary/60"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {displayName(member)}
                    </p>
                    {member.email && (
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removingId === member.id}
                  >
                    <UserMinusIcon className="size-3.5" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={open => !open && setConfirmDelete(null)}
        title="Delete group"
        description={`You are about to permanently delete "${confirmDelete?.name ?? ''}". All member assignments will be lost.`}
        confirmLabel="Delete group"
        variant="destructive"
        loading={deletingId === confirmDelete?.id}
        onConfirm={async () => { if (confirmDelete) await handleDelete(confirmDelete.id) }}
      />
    </div>
  )
}
