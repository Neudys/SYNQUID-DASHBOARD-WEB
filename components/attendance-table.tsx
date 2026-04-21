'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  ClockIcon,
} from 'lucide-react'
import { API } from '@/lib/endpoints'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

interface AttendanceRecord {
  id: string
  userId?: string
  deviceId?: string
  employeeName?: string
  userName?: string
  readerName?: string
  readerId?: string
  timestamp?: string
  timestampUtc?: string
  timestampLocal?: string
  createdAt?: string
}

interface Reader {
  id: string
  name: string
}

const PAGE_SIZE = 10

export function AttendanceTable() {
  const container = useRef<HTMLDivElement>(null)
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [readers, setReaders] = useState<Reader[]>([])
  const [readerId, setReaderId] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<AttendanceRecord | null>(null)

  const selectedReader = useMemo(
    () => readers.find((r) => r.id === readerId),
    [readers, readerId],
  )

  const filteredRecords = useMemo(() => {
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null

    return allRecords.filter((r) => {
      if (readerId !== 'all') {
        const matchesId = r.readerId === readerId
        const matchesName = selectedReader ? r.readerName === selectedReader.name : false
        if (!matchesId && !matchesName) return false
      }

      const ts = r.timestampUtc ?? r.timestampLocal ?? r.timestamp ?? r.createdAt
      if (!ts) return !fromTime && !toTime

      const t = new Date(ts).getTime()
      if (fromTime !== null && t < fromTime) return false
      if (toTime !== null && t > toTime) return false
      return true
    })
  }, [allRecords, readerId, selectedReader, dateFrom, dateTo])

  const total = filteredRecords.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const records = useMemo(
    () => filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRecords, page],
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API.attendanceAll)
      if (!res.ok) return
      const data = await res.json()

      await Promise.all(
        data.map(async (record: AttendanceRecord) => {
          const [resU, resD] = await Promise.all([
            fetch(`${API.readers}/${record.deviceId}`),
            fetch(`${API.users}/${record.userId}`),
          ])
          if (resU.ok) {
            const readerData = await resU.json()
            const d = readerData.deviceInfo ?? readerData
            record.readerName = d?.name || d?.deviceName || record.readerName || ''
          }
          if (resD.ok) {
            const userData = await resD.json()
            const u = userData.userData ?? userData
            record.userName =
              u?.firstName ||
              u?.name ||
              u?.fullName ||
              u?.displayName ||
              u?.userName ||
              u?.email ||
              record.userName ||
              ''
          }
        }),
      )

      const list: AttendanceRecord[] = Array.isArray(data)
        ? data
        : (data.items ?? [])
      setAllRecords(list)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [page, totalPages])

  useEffect(() => {
    fetch(API.readers)
      .then((r) => r.json())
      .then((data: Reader[] | { items: Reader[] }) => {
        setReaders(Array.isArray(data) ? data : data.items ?? [])
      })
      .catch(() => {})
  }, [])

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
          stagger: STAGGER.normal,
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
    { scope: container, dependencies: [loading, records] },
  )

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`${API.attendance}/${id}`, { method: 'DELETE' })
      await fetchData()
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div ref={container} className="flex flex-col gap-5">
      {/* Filter surface */}
      <section
        data-surface
        className="rounded-xl border border-border/60 bg-linear-to-br from-secondary/40 via-card/70 to-card/70 p-5 backdrop-blur-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FilterIcon className="size-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        </div>
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">From</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40 bg-background/80"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dateTo" className="text-xs text-muted-foreground">To</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40 bg-background/80"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Reader</Label>
            <Select value={readerId} onValueChange={(v) => setReaderId(v ?? 'all')}>
              <SelectTrigger className="w-48 bg-background/80">
                <SelectValue placeholder="All readers">
                  {readerId === 'all'
                    ? 'All readers'
                    : selectedReader?.name ?? 'All readers'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All readers</SelectItem>
                {readers.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                setReaderId('all')
                setPage(1)
              }}
            >
              Clear
            </Button>
            <Button
              type="submit"
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out"
            >
              Apply
            </Button>
          </div>
        </form>
      </section>

      {/* Table surface */}
      <section
        data-surface
        className="overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 border-b border-border/50 bg-linear-to-r from-teal/8 via-transparent to-transparent px-5 py-3.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-teal/15 text-teal">
            <ClockIcon className="size-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Attendance log</h3>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {total} {total === 1 ? 'record' : 'records'}
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-xs uppercase tracking-wider">Employee</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Reader</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Timestamp</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No attendance records match these filters.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow
                  key={record.id}
                  data-row
                  className="border-border/40 transition-colors duration-150 ease-out hover:bg-secondary/40"
                >
                  <TableCell className="font-medium">
                    {record.employeeName || record.userName || '—'}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-sage/30 px-2 py-0.5 text-xs font-medium text-forest dark:bg-sage/15 dark:text-sage">
                      {record.readerName || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {(() => {
                      const ts =
                        record.timestampUtc ??
                        record.timestampLocal ??
                        record.timestamp ??
                        record.createdAt
                      return ts ? new Date(ts).toLocaleString() : '—'
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmDelete(record)}
                      disabled={deletingId === record.id}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border/50 bg-secondary/20 px-5 py-3 text-sm text-muted-foreground">
          <span className="tabular-nums">
            {total > 0
              ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
              : '0 records'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer bg-background/80"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="tabular-nums px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer bg-background/80"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Delete attendance confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete attendance record"
        description={`You are about to permanently delete the attendance record for "${confirmDelete?.employeeName ?? confirmDelete?.userName ?? 'this employee'}". This action cannot be undone.`}
        confirmLabel="Delete record"
        variant="destructive"
        loading={deletingId === confirmDelete?.id}
        onConfirm={async () => {
          if (confirmDelete) await handleDelete(confirmDelete.id)
        }}
      />
    </div>
  )
}
