'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  ListIcon,
  Loader2Icon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TeacherGroup } from '@/components/teacher-group-selector'

interface Student {
  userId: string
  firstName: string
  lastName: string
  email: string
}

interface AttendanceRecord {
  id: string
  userId: string
  status?: number
  timestamp?: string
  timestampLocal?: string
  date?: string
}

type ViewMode = 'day' | 'month'

const STATUS_LABEL: Record<number, string> = {
  0: 'Present',
  1: 'Absent',
  2: 'Excused',
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface Props {
  groups: TeacherGroup[]
}

export function TeacherCalendar({ groups }: Props) {
  const [mounted, setMounted] = useState(false)
  const [groupId, setGroupId] = useState<string>(groups[0]?.groupId ?? '')
  const [view, setView] = useState<ViewMode>('day')
  const [date, setDate] = useState<Date | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    setDate(new Date())
  }, [])

  const today = useMemo(() => {
    if (!date) return null
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [date])

  const isFutureDate = date && today ? date.getTime() > today.getTime() : false

  const loadStudents = useCallback(async () => {
    if (!groupId) {
      setStudents([])
      return
    }
    try {
      const res = await fetch(`/api/teacher/groups/${groupId}/students?page=1&limit=100`)
      const body = await res.json().catch(() => ({}))
      setStudents(Array.isArray(body?.data) ? body.data : [])
    } catch {
      setStudents([])
    }
  }, [groupId])

  const loadDay = useCallback(async () => {
    if (!groupId || !date) {
      setRecords([])
      return
    }
    setLoading(true)
    try {
      const iso = toIsoDate(date)
      const res = await fetch(
        `/api/attendance/history?groupId=${groupId}&from=${iso}&to=${iso}&page=1&limit=200`,
      )
      const body = await res.json().catch(() => ({}))
      const data: AttendanceRecord[] = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body)
          ? body
          : []
      setRecords(data)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [groupId, date])

  const loadMonth = useCallback(async () => {
    if (!groupId || !date || !today) {
      setMonthRecords([])
      return
    }
    setLoading(true)
    try {
      const first = new Date(date.getFullYear(), date.getMonth(), 1)
      const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      const from = toIsoDate(first)
      const to = toIsoDate(last > today ? today : last)
      const res = await fetch(
        `/api/attendance/history?groupId=${groupId}&from=${from}&to=${to}&page=1&limit=2000`,
      )
      const body = await res.json().catch(() => ({}))
      const data: AttendanceRecord[] = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body)
          ? body
          : []
      setMonthRecords(data)
    } catch {
      setMonthRecords([])
    } finally {
      setLoading(false)
    }
  }, [groupId, date, today])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  useEffect(() => {
    if (view === 'day') loadDay()
    else loadMonth()
  }, [view, loadDay, loadMonth])

  // Map records to userId for quick lookup in day view
  const recordByUser = useMemo(() => {
    const map = new Map<string, AttendanceRecord>()
    for (const r of records) map.set(r.userId, r)
    return map
  }, [records])

  async function updateStatus(student: Student, newStatus: number) {
    if (isFutureDate) return
    const existing = recordByUser.get(student.userId)
    setUpdating(student.userId)

    // Optimistic update
    const optimistic: AttendanceRecord = existing
      ? { ...existing, status: newStatus }
      : {
          id: `tmp-${student.userId}`,
          userId: student.userId,
          status: newStatus,
          timestampLocal: new Date().toISOString(),
        }
    setRecords((prev) => {
      const without = prev.filter((r) => r.userId !== student.userId)
      return [...without, optimistic]
    })

    try {
      if (existing && !existing.id.startsWith('tmp-')) {
        const nowIso = new Date().toISOString()
        await fetch(`/api/attendance/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestampUtc: nowIso,
            timestampLocal: nowIso,
            status: newStatus,
            notes: '',
          }),
        })
      } else {
        const params = new URLSearchParams({
          userId: student.userId,
          status: String(newStatus),
          notes: '',
        })
        await fetch(`/api/attendance/manual?${params.toString()}`, {
          method: 'POST',
        })
      }
      // Refetch to get authoritative state (id from new manual record, etc.)
      await loadDay()
    } catch {
      // Revert by reloading
      await loadDay()
    } finally {
      setUpdating(null)
    }
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        You don&apos;t have any classes assigned yet.
      </div>
    )
  }

  if (!mounted || !date || !today) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/60 px-4 py-12 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Loading calendar…
      </div>
    )
  }

  const currentDate = date
  const currentToday = today

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden min-h-0">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Class
          </label>
          <Select value={groupId} onValueChange={(v) => v && setGroupId(v)}>
            <SelectTrigger className="w-full max-w-xs bg-card/80 backdrop-blur-sm">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.groupId} value={g.groupId}>
                  {g.groupName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 p-1 backdrop-blur-sm">
          <Button
            variant={view === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('day')}
            className="cursor-pointer"
          >
            <ListIcon className="size-4" />
            Day
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('month')}
            className="cursor-pointer"
          >
            <LayoutGridIcon className="size-4" />
            Month
          </Button>
        </div>
      </div>

      {view === 'day' ? (
        <DayView
          date={currentDate}
          today={currentToday}
          students={students}
          recordByUser={recordByUser}
          loading={loading}
          updating={updating}
          isFutureDate={isFutureDate}
          onPrev={() => setDate(addDays(currentDate, -1))}
          onNext={() => {
            const next = addDays(currentDate, 1)
            if (next.getTime() <= currentToday.getTime()) setDate(next)
          }}
          onToday={() => setDate(new Date())}
          onUpdate={updateStatus}
        />
      ) : (
        <MonthView
          date={currentDate}
          today={currentToday}
          records={monthRecords}
          loading={loading}
          onPickDay={(d) => {
            setDate(d)
            setView('day')
          }}
          onPrevMonth={() =>
            setDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
          }
          onNextMonth={() => {
            const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
            if (next.getTime() <= new Date(currentToday.getFullYear(), currentToday.getMonth() + 1, 1).getTime()) {
              setDate(next)
            }
          }}
        />
      )}
    </div>
  )
}

function DayView({
  date,
  today,
  students,
  recordByUser,
  loading,
  updating,
  isFutureDate,
  onPrev,
  onNext,
  onToday,
  onUpdate,
}: {
  date: Date
  today: Date
  students: Student[]
  recordByUser: Map<string, AttendanceRecord>
  loading: boolean
  updating: string | null
  isFutureDate: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onUpdate: (student: Student, status: number) => void
}) {
  const canGoNext = date.getTime() < today.getTime()
  return (
    <Card className="flex flex-col flex-1 min-h-0 overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-linear-to-r from-primary/8 via-transparent to-teal/10 px-5 py-3.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">{formatLongDate(date)}</h2>
          <p className="text-xs text-muted-foreground">
            {sameDay(date, today) ? 'Today' : isFutureDate ? 'Future (read-only)' : 'Past day'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onPrev} className="cursor-pointer">
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            disabled={sameDay(date, today)}
            className="cursor-pointer"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!canGoNext}
            className="cursor-pointer"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
      <CardContent className="flex-1 overflow-auto min-h-0 p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Loading attendance…
          </div>
        ) : students.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No students enrolled in this class.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="text-xs uppercase tracking-wider">Student</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const record = recordByUser.get(s.userId)
                const currentStatus = record?.status ?? 1 // default Absent
                const isUpdating = updating === s.userId
                return (
                  <TableRow key={s.userId} className="border-border/40">
                    <TableCell className="font-medium">
                      {s.firstName} {s.lastName}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Select
                          value={String(currentStatus)}
                          onValueChange={(v) => {
                            if (v == null) return
                            const n = Number(v)
                            if (n !== currentStatus) onUpdate(s, n)
                          }}
                          disabled={isFutureDate || isUpdating}
                        >
                          <SelectTrigger size="sm" className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">{STATUS_LABEL[0]}</SelectItem>
                            <SelectItem value="1">{STATUS_LABEL[1]}</SelectItem>
                            <SelectItem value="2">{STATUS_LABEL[2]}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function MonthView({
  date,
  today,
  records,
  loading,
  onPickDay,
  onPrevMonth,
  onNextMonth,
}: {
  date: Date
  today: Date
  records: AttendanceRecord[]
  loading: boolean
  onPickDay: (d: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const firstWeekday = firstOfMonth.getDay() // 0 = Sunday
  const daysInMonth = lastOfMonth.getDate()

  // Count records per day
  const countByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of records) {
      const ts = r.timestampLocal ?? r.timestamp ?? r.date
      if (!ts) continue
      const d = new Date(ts)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [records])

  const cells: Array<{ day: number; date: Date } | null> = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, date: new Date(year, month, day) })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const isNextMonthFuture =
    new Date(year, month + 1, 1).getTime() > new Date(today.getFullYear(), today.getMonth(), 1).getTime()

  return (
    <Card className="flex flex-col flex-1 min-h-0 overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-r from-primary/8 via-transparent to-teal/10 px-5 py-3.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold capitalize text-foreground">{monthLabel}</h2>
          <p className="text-xs text-muted-foreground">Click a past day to see attendance</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onPrevMonth} className="cursor-pointer">
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextMonth}
            disabled={isNextMonthFuture}
            className="cursor-pointer"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
      <CardContent className="flex-1 overflow-auto min-h-0 p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Loading month…
          </div>
        ) : (
          <div className="grid gap-1">
            <div className="grid grid-cols-7 gap-1 pb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                if (!cell) return <div key={i} className="aspect-square" />
                const isFuture = cell.date.getTime() > today.getTime()
                const isToday = sameDay(cell.date, today)
                const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`
                const count = countByDay.get(key) ?? 0
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isFuture}
                    onClick={() => onPickDay(cell.date)}
                    className={`group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border text-sm transition-all duration-150 ease-out ${
                      isFuture
                        ? 'cursor-not-allowed border-border/30 bg-muted/20 text-muted-foreground/50'
                        : isToday
                          ? 'border-teal/60 bg-teal/15 font-semibold text-teal hover:bg-teal/25'
                          : 'border-border/40 bg-background/40 text-foreground hover:border-primary/50 hover:bg-primary/10'
                    }`}
                  >
                    <span>{cell.day}</span>
                    {count > 0 && !isFuture && (
                      <span className="mt-0.5 text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
