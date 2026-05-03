'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  ListIcon,
  Loader2Icon,
  PencilIcon,
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

interface DailyRecord {
  id: string
  userId: string
  status: number
  modifiedById?: string | null
}

interface RosterEntry {
  userId: string
  firstName: string
  lastName: string
  email: string
  status: number
  isManuallyModified: boolean
}

interface MonthRecord {
  id: string
  userId: string
  date?: string
  status?: number
}

type ViewMode = 'day' | 'month'

const STATUS_CONFIG: Record<number, { label: string; textClass: string; bgClass: string; dotClass: string }> = {
  0: { label: 'Presente',    textClass: 'text-teal-600',    bgClass: 'bg-teal-500/15',    dotClass: 'bg-teal-500' },
  1: { label: 'Ausente',     textClass: 'text-destructive', bgClass: 'bg-destructive/10', dotClass: 'bg-destructive' },
  2: { label: 'Justificado', textClass: 'text-primary',     bgClass: 'bg-primary/10',     dotClass: 'bg-primary' },
  3: { label: 'Tarde',       textClass: 'text-amber-600',   bgClass: 'bg-amber-500/10',   dotClass: 'bg-amber-500' },
}

function toLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en', {
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
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [monthRecords, setMonthRecords] = useState<MonthRecord[]>([])
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

  const isFutureDate = date && today
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() > today.getTime()
    : false

  // Carga alumnos + DailyAttendance del dÃ­a en paralelo y construye el roster
  const loadRoster = useCallback(async () => {
    if (!groupId || !date) { setRoster([]); return }
    setLoading(true)
    try {
      const iso = toLocalDate(date)
      const [studentsRes, dailyRes] = await Promise.all([
        fetch(`/api/teacher/groups/${groupId}/students?page=1&limit=100`),
        fetch(`/api/attendance/daily/group/${groupId}?date=${iso}`),
      ])
      const [studentsBody, dailyBody] = await Promise.all([
        studentsRes.json().catch(() => ({})),
        dailyRes.json().catch(() => ({})),
      ])

      const studentsList: Student[] = Array.isArray(studentsBody?.data) ? studentsBody.data : []
      const attendances: DailyRecord[] = Array.isArray(dailyBody?.attendances) ? dailyBody.attendances : []

      // scheduleId del primer registro existente (fallback para creaciÃ³n manual)
      const attendanceMap = new Map(attendances.map(a => [a.userId, a]))
      setRoster(studentsList.map(s => {
        const att = attendanceMap.get(s.userId)
        return {
          userId: s.userId,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          status: att?.status ?? 1, // sin fila = Ausente
          isManuallyModified: !!att?.modifiedById,
        }
      }))
    } catch (err) {
      setRoster([])
    } finally {
      setLoading(false)
    }
  }, [groupId, date])

  const loadMonth = useCallback(async () => {
    if (!groupId || !date || !today) { setMonthRecords([]); return }
    setLoading(true)
    try {
      const first = new Date(date.getFullYear(), date.getMonth(), 1)
      const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      const from = toLocalDate(first)
      const to = toLocalDate(last > today ? today : last)
      const res = await fetch(
        `/api/attendance/history?groupId=${groupId}&from=${from}&to=${to}&page=1&limit=2000`,
      )
      const body = await res.json().catch(() => ({}))
      setMonthRecords(
        Array.isArray(body?.attendances) ? body.attendances
        : Array.isArray(body?.data) ? body.data
        : Array.isArray(body) ? body : [],
      )
    } catch (err) {
      setMonthRecords([])
    } finally {
      setLoading(false)
    }
  }, [groupId, date, today])

  useEffect(() => {
    if (view === 'day') loadRoster()
    else loadMonth()
  }, [view, loadRoster, loadMonth])

  async function updateStatus(entry: RosterEntry, newStatus: number) {
    if (isFutureDate || !date) return
    setUpdating(entry.userId)
    // ActualizaciÃ³n optimista
    setRoster(prev => prev.map(r => r.userId === entry.userId ? { ...r, status: newStatus } : r))

    try {
      const res = await fetch('/api/attendance/daily', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:  entry.userId,
          groupId: groupId,
          date:    toLocalDate(date),
          status:  newStatus,
        }),
      })
      await loadRoster()
    } catch (err) {
      await loadRoster()
    } finally {
      setUpdating(null)
    }
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        You don't have any classes assigned yet.
      </div>
    )
  }

  if (!mounted || !date || !today) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/60 px-4 py-12 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Loading calendar...
      </div>
    )
  }

  const currentDate = date
  const currentToday = today

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden min-h-0">
      {/* Controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Clase
          </label>
          <Select value={groupId} onValueChange={(v) => v && setGroupId(v)}>
            <SelectTrigger className="w-full max-w-xs bg-card/80 backdrop-blur-sm">
              <SelectValue placeholder="Seleccionar clase">
                {groupId
                  ? groups.find(g => g.groupId === groupId)?.groupName ?? 'Seleccionar clase'
                  : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {groups.map(g => (
                <SelectItem key={g.groupId} value={g.groupId}>{g.groupName}</SelectItem>
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
            Mes
          </Button>
        </div>
      </div>

      {view === 'day' ? (
        <DayView
          date={currentDate}
          today={currentToday}
          roster={roster}
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
          onPickDay={(d) => { setDate(d); setView('day') }}
          onPrevMonth={() =>
            setDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
          }
          onNextMonth={() => {
            const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
            if (
              next.getTime() <=
              new Date(currentToday.getFullYear(), currentToday.getMonth() + 1, 1).getTime()
            ) {
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
  roster,
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
  roster: RosterEntry[]
  loading: boolean
  updating: string | null
  isFutureDate: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onUpdate: (entry: RosterEntry, status: number) => void
}) {
  const canGoNext = date.getTime() < today.getTime()

  const counts = useMemo(() => {
    const c: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
    for (const r of roster) c[r.status] = (c[r.status] ?? 0) + 1
    return c
  }, [roster])

  return (
    <Card className="flex flex-col flex-1 min-h-0 overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
      {/* Cabecera con navegaciÃ³n */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-linear-to-r from-primary/8 via-transparent to-teal/10 px-5 py-3.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold capitalize text-foreground">{formatLongDate(date)}</h2>
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
            Hoy
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

      {/* Barra de resumen del dÃ­a */}
      {!loading && roster.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 border-b border-border/40 bg-muted/20 px-5 py-2">
          {([0, 1, 2, 3] as const).map(s => (
            <span key={s} className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_CONFIG[s].textClass}`}>
              <span className={`inline-block size-2 rounded-full ${STATUS_CONFIG[s].dotClass}`} />
              {counts[s] ?? 0} {STATUS_CONFIG[s].label}
            </span>
          ))}
        </div>
      )}

      <CardContent className="flex-1 overflow-auto min-h-0 p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Loading attendance...
          </div>
        ) : roster.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No hay alumnos en esta clase.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="text-xs uppercase tracking-wider">Alumno</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map(entry => {
                const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG[1]
                return (
                  <TableRow key={entry.userId} className="border-border/40">
                    <TableCell>
                      <span className="font-medium">{entry.firstName} {entry.lastName}</span>
                      {entry.isManuallyModified && (
                        <span className="ml-2 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted/50">
                          <PencilIcon className="size-2.5" />
                          Manual
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Select
                          value={String(entry.status)}
                          onValueChange={v => {
                            if (v == null) return
                            const n = Number(v)
                            if (n !== entry.status) onUpdate(entry, n)
                          }}
                          disabled={isFutureDate || updating === entry.userId}
                        >
                          <SelectTrigger
                            size="sm"
                            className={`w-36 font-medium ${cfg.bgClass} ${cfg.textClass}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {([0, 1, 2, 3] as const).map(s => (
                              <SelectItem key={s} value={String(s)}>
                                <span className={STATUS_CONFIG[s].textClass}>
                                  {STATUS_CONFIG[s].label}
                                </span>
                              </SelectItem>
                            ))}
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
  records: MonthRecord[]
  loading: boolean
  onPickDay: (d: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const firstWeekday = firstOfMonth.getDay()
  const daysInMonth = lastOfMonth.getDate()

  // EstadÃ­sticas por dÃ­a para colorear las celdas
  const statsByDay = useMemo(() => {
    type DayStats = { present: number; absent: number; late: number; excused: number; total: number }
    const map = new Map<string, DayStats>()
    for (const r of records) {
      if (!r.date) continue
      const s = map.get(r.date) ?? { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
      s.total++
      if (r.status === 0) s.present++
      else if (r.status === 1) s.absent++
      else if (r.status === 2) s.excused++
      else if (r.status === 3) s.late++
      map.set(r.date, s)
    }
    return map
  }, [records])

  const cells: Array<{ day: number; date: Date } | null> = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, date: new Date(year, month, day) })
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = date.toLocaleDateString('en', { month: 'long', year: 'numeric' })
  const isNextMonthFuture =
    new Date(year, month + 1, 1).getTime() >
    new Date(today.getFullYear(), today.getMonth(), 1).getTime()

  return (
    <Card className="flex flex-col flex-1 min-h-0 overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-r from-primary/8 via-transparent to-teal/10 px-5 py-3.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold capitalize text-foreground">{monthLabel}</h2>
          <p className="text-xs text-muted-foreground">Click a day to see attendance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Leyenda de colores */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-sm bg-teal-500/50" />{'>=80%'}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-sm bg-amber-500/50" />{'>=50%'}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-sm bg-destructive/40" />{'<50%'}
            </span>
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
      </div>
      <CardContent className="flex-1 overflow-auto min-h-0 p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Loading month...
          </div>
        ) : (
          <div className="grid gap-1">
            <div className="grid grid-cols-7 gap-1 pb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div
                  key={d}
                  className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                if (!cell) return <div key={i} className="aspect-square" />
                const isFuture = cell.date.getTime() > today.getTime()
                const isToday = sameDay(cell.date, today)
                const key = toLocalDate(cell.date)
                const stats = statsByDay.get(key)
                // Tasa de asistencia real: presentes + tardÃ­os sobre total
                const attendedRate = stats ? (stats.present + stats.late) / stats.total : null

                let cellCls: string
                if (isFuture) {
                  cellCls = 'cursor-not-allowed border-border/30 bg-muted/20 text-muted-foreground/50'
                } else if (isToday) {
                  cellCls = 'border-teal/60 bg-teal/15 font-semibold text-teal-700 hover:bg-teal/25'
                } else if (attendedRate === null) {
                  cellCls = 'border-border/40 bg-background/40 text-foreground hover:border-primary/50 hover:bg-primary/10'
                } else if (attendedRate >= 0.8) {
                  cellCls = 'border-teal-400/50 bg-teal-500/10 text-teal-700 hover:bg-teal-500/20'
                } else if (attendedRate >= 0.5) {
                  cellCls = 'border-amber-400/50 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'
                } else {
                  cellCls = 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20'
                }

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isFuture}
                    onClick={() => onPickDay(cell.date)}
                    className={`group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border text-sm transition-all duration-150 ease-out ${cellCls}`}
                  >
                    <span>{cell.day}</span>
                    {stats && !isFuture && (
                      <span className="mt-0.5 text-[9px] font-medium opacity-60 group-hover:opacity-100">
                        {stats.present + stats.late}/{stats.total}
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
