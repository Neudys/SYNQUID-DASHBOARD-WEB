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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { TrashIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { API } from '@/lib/endpoints'

interface AttendanceRecord {
  id: string
  employeeName?: string
  userName?: string
  readerName?: string
  readerId?: string
  timestamp?: string
  createdAt?: string
}

interface PagedResult {
  items: AttendanceRecord[]
  totalCount: number
  page: number
  pageSize: number
}

interface Reader {
  id: string
  name: string
}

const PAGE_SIZE = 10

export function AttendanceTable() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [readers, setReaders] = useState<Reader[]>([])
  const [readerId, setReaderId] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      })
      if (readerId && readerId !== 'all') params.set('readerId', readerId)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const res = await fetch(`${API.attendance}?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json() as PagedResult | AttendanceRecord[]
      if (Array.isArray(data)) {
        setRecords(data)
        setTotal(data.length)
      } else {
        setRecords(data.items ?? [])
        setTotal(data.totalCount ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [page, readerId, dateFrom, dateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetch(API.readers)
      .then((r) => r.json())
      .then((data: Reader[] | { items: Reader[] }) => {
        setReaders(Array.isArray(data) ? data : data.items ?? [])
      })
      .catch(() => {})
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this attendance record?')) return
    setDeletingId(id)
    try {
      await fetch(`${API.attendance}/${id}`, { method: 'DELETE' })
      await fetchData()
    } finally {
      setDeletingId(null)
    }
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dateFrom" className="text-xs">From</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dateTo" className="text-xs">To</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Reader</Label>
          <Select value={readerId} onValueChange={(v) => setReaderId(v ?? 'all')}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All readers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All readers</SelectItem>
              {readers.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="outline" className="border-forest text-forest hover:bg-forest hover:text-cream">
          Apply
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => { setDateFrom(''); setDateTo(''); setReaderId('all'); setPage(1) }}
        >
          Clear
        </Button>
      </form>

      {/* Table */}
      <div className="rounded-lg border border-sage overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Employee</TableHead>
              <TableHead>Reader</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground text-sm">
                  No attendance records found.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.employeeName ?? record.userName ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-sage/40 text-ink border-0">
                      {record.readerName ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {record.timestamp ?? record.createdAt
                      ? new Date(record.timestamp ?? record.createdAt!).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(record.id)}
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total > 0 ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}` : '0 records'}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="tabular-nums">{page} / {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
