'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/loading-spinner'
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BookOpenIcon,
  Clock3Icon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
} from 'lucide-react'
import { API } from '@/lib/endpoints'

interface AttendanceRecord {
  id: string
  status?: number
  date?: string
  groupId?: string
  groupName?: string
  scheduleId?: string
  scheduleStart?: string
  scheduleEnd?: string
}

interface Group {
  groupId: string
  groupName: string
  level?: string
  institutionId?: string
  professorId?: string
  joinedAt?: string
}

interface Schedule {
  scheduleId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  lateToleranceMinutes?: number
}

const STATUS_LABEL: Record<number, { label: string; color: string }> = {
  0: { label: 'Presente',    color: 'text-teal-600 bg-teal-500/15' },
  1: { label: 'Ausente',     color: 'text-destructive bg-destructive/10' },
  2: { label: 'Justificado', color: 'text-primary bg-primary/10' },
  3: { label: 'Tarde',       color: 'text-amber-600 bg-amber-500/10' },
}

const STATUS_CELL: Record<number, { border: string; bg: string; text: string; dot: string }> = {
  0: { border: 'border-teal-400/50',      bg: 'bg-teal-500/10',    text: 'text-teal-700',    dot: 'bg-teal-500' },
  1: { border: 'border-destructive/40',   bg: 'bg-destructive/10', text: 'text-destructive', dot: 'bg-destructive' },
  2: { border: 'border-primary/40',       bg: 'bg-primary/10',     text: 'text-primary',     dot: 'bg-primary' },
  3: { border: 'border-amber-400/50',     bg: 'bg-amber-500/10',   text: 'text-amber-700',   dot: 'bg-amber-500' },
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function toLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDate(record: AttendanceRecord): string {
  if (!record.date) return 'â€”'
  const [y, m, d] = record.date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
  return timeStr
}

// Peor estado del dÃ­a: ausente > tarde > justificado > presente
function worstStatus(recs: AttendanceRecord[]): number {
  if (recs.some(r => r.status === 1)) return 1
  if (recs.some(r => r.status === 3)) return 3
  if (recs.some(r => r.status === 2)) return 2
  return 0
}

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'faltas' | 'clases' | 'calendario'>('faltas')

  // --- Faltas ---
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loadingFaltas, setLoadingFaltas] = useState(true)

  // --- Mis Clases ---
  const [groups, setGroups] = useState<Group[]>([])
  const [schedulesMap, setSchedulesMap] = useState<Record<string, Schedule[]>>({})
  const [loadingClases, setLoadingClases] = useState(false)
  const [clasesFetched, setClasesFetched] = useState(false)

  // --- Calendario ---
  const [calDate, setCalDate] = useState<Date>(new Date())
  const [calRecords, setCalRecords] = useState<AttendanceRecord[]>([])
  const [loadingCal, setLoadingCal] = useState(false)
  const [calFetchedKey, setCalFetchedKey] = useState<string | null>(null)
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Fetch Faltas al montar
  useEffect(() => {
    fetch('/api/attendance/my')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoadingFaltas(false))
  }, [])

  // Fetch Clases cuando se activa el tab
  useEffect(() => {
    if (activeTab === 'clases' && !clasesFetched) {
      setLoadingClases(true)
      const fetchClases = async () => {
        try {
          const resGroups = await fetch(API.student.myGroups)
          let groupsData: Group[] = []

          if (resGroups.ok) {
            const data = await resGroups.json()
            groupsData = data.groups ?? []
            setGroups(groupsData)
          } else {
          }

          const newSchedulesMap: Record<string, Schedule[]> = {}
          if (groupsData.length > 0) {
            await Promise.all(
              groupsData.map(async (group) => {
                try {
                  const resSchedule = await fetch(API.groupsSchedules(group.groupId))
                  if (resSchedule.ok) {
                    const data = await resSchedule.json()
                    newSchedulesMap[group.groupId] = data.schedules ?? []
                  } else {
                    newSchedulesMap[group.groupId] = []
                  }
                } catch {
                  newSchedulesMap[group.groupId] = []
                }
              }),
            )
            setSchedulesMap(newSchedulesMap)
          }
        } catch {
        } finally {
          setLoadingClases(false)
          setClasesFetched(true)
        }
      }
      fetchClases()
    }
  }, [activeTab, clasesFetched])

  // Fetch Calendario mensual cuando cambia el mes o se activa el tab
  useEffect(() => {
    if (activeTab !== 'calendario') return
    const key = `${calDate.getFullYear()}-${calDate.getMonth()}`
    if (calFetchedKey === key) return
    setLoadingCal(true)
    const first = new Date(calDate.getFullYear(), calDate.getMonth(), 1)
    const last = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0)
    const from = toLocalDate(first)
    const to = toLocalDate(last)
    fetch(`/api/attendance/my?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setCalRecords(Array.isArray(data) ? data : []); setCalFetchedKey(key) })
      .catch(() => setCalRecords([]))
      .finally(() => setLoadingCal(false))
  }, [activeTab, calDate, calFetchedKey])

  const present = records.filter(r => r.status === 0).length
  const absent  = records.filter(r => r.status === 1).length
  const excused = records.filter(r => r.status === 2).length
  const late    = records.filter(r => r.status === 3).length
  const total   = records.length

  if (loadingFaltas && activeTab === 'faltas') return <LoadingSpinner />

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Tabs */}
      <div className="flex gap-2">
        {(['faltas', 'clases', 'calendario'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer capitalize ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            {tab === 'faltas' ? 'Faltas' : tab === 'clases' ? 'Mis Clases' : 'Calendario'}
          </button>
        ))}
      </div>

      {/* â”€â”€ Tab: Faltas â”€â”€ */}
      {activeTab === 'faltas' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600">
                  <CheckCircleIcon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{present}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Presente</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <XCircleIcon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{absent}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Ausente</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ClockIcon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{excused}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Justificado</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <AlertTriangleIcon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{late}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Tarde</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-r from-primary/8 via-transparent to-teal/10 px-5 py-3.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarIcon className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Historial de Asistencia</h2>
                <p className="text-xs text-muted-foreground">
                  {total} registro{total !== 1 ? 's' : ''} en total
                </p>
              </div>
            </div>
            <CardContent className="p-0">
              {records.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No hay registros de asistencia todavÃ­a.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {records.slice().reverse().map(r => {
                    const s = STATUS_LABEL[r.status ?? 1]
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-3">
                        <span className="text-sm text-foreground">{formatDate(r)}</span>
                        {r.groupName && (
                          <span className="hidden text-xs text-muted-foreground sm:block">
                            {r.groupName}
                          </span>
                        )}
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${s.color}`}>
                          {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* â”€â”€ Tab: Mis Clases â”€â”€ */}
      {activeTab === 'clases' && (
        <div className="flex flex-col gap-4">
          {loadingClases ? (
            <LoadingSpinner />
          ) : groups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center">
              <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                <BookOpenIcon className="size-5" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">No tienes clases asignadas</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cuando un profesor te agregue a un grupo, aparecerÃ¡ aquÃ­.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map(group => {
                const groupSchedules = schedulesMap[group.groupId] || []
                return (
                  <Card
                    key={group.groupId}
                    className="flex flex-col overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-colors hover:border-primary/40"
                  >
                    <div className="flex flex-col border-b border-border/40 px-5 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground leading-tight">{group.groupName}</h3>
                        {group.level && (
                          <span className="shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                            {group.level}
                          </span>
                        )}
                      </div>
                    </div>
                    <CardContent className="flex flex-col gap-3 p-5 bg-secondary/10 flex-1">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock3Icon className="size-3.5" />
                        Horario
                      </h4>
                      {groupSchedules.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay horarios registrados.</p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {groupSchedules.map(sch => (
                            <li
                              key={sch.scheduleId}
                              className="flex items-center justify-between text-sm bg-card/50 rounded-md p-2 border border-border/40"
                            >
                              <span className="font-medium text-foreground">
                                {DAYS_OF_WEEK[sch.dayOfWeek] || sch.dayOfWeek}
                              </span>
                              <span className="text-muted-foreground tabular-nums">
                                {formatTime(sch.startTime)} - {formatTime(sch.endTime)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ Tab: Calendario â”€â”€ */}
      {activeTab === 'calendario' && (
        <StudentCalendarView
          calDate={calDate}
          today={today}
          records={calRecords}
          loading={loadingCal}
          onPrevMonth={() => {
            setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))
            setCalFetchedKey(null)
          }}
          onNextMonth={() => {
            const next = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1)
            if (next.getTime() <= new Date(today.getFullYear(), today.getMonth(), 1).getTime()) {
              setCalDate(next)
              setCalFetchedKey(null)
            }
          }}
        />
      )}
    </div>
  )
}

function StudentCalendarView({
  calDate,
  today,
  records,
  loading,
  onPrevMonth,
  onNextMonth,
}: {
  calDate: Date
  today: Date
  records: AttendanceRecord[]
  loading: boolean
  onPrevMonth: () => void
  onNextMonth: () => void
}) {
  const year = calDate.getFullYear()
  const month = calDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const firstWeekday = firstOfMonth.getDay()
  const daysInMonth = lastOfMonth.getDate()

  // Agrupar registros por fecha â†’ peor estado del dÃ­a
  const statusByDay = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>()
    for (const r of records) {
      if (!r.date) continue
      const arr = map.get(r.date) ?? []
      arr.push(r)
      map.set(r.date, arr)
    }
    const result = new Map<string, number>()
    for (const [date, recs] of map) result.set(date, worstStatus(recs))
    return result
  }, [records])

  const cells: Array<{ day: number; date: Date } | null> = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, date: new Date(year, month, day) })
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = calDate.toLocaleDateString('es', { month: 'long', year: 'numeric' })
  const isNextMonthFuture =
    new Date(year, month + 1, 1).getTime() > new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime()

  return (
    <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
      {/* Cabecera */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-r from-primary/8 via-transparent to-teal/10 px-5 py-3.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold capitalize text-foreground">{monthLabel}</h2>
          <p className="text-xs text-muted-foreground">Tu asistencia mensual</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Leyenda */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground">
            {([0, 1, 2, 3] as const).map(s => (
              <span key={s} className={`flex items-center gap-1 ${STATUS_CELL[s].text}`}>
                <span className={`inline-block size-2 rounded-sm ${STATUS_CELL[s].dot}`} />
                {STATUS_LABEL[s].label}
              </span>
            ))}
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

      <CardContent className="p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Cargandoâ€¦
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
                const status = statusByDay.get(key)
                const cfg = status !== undefined ? STATUS_CELL[status] : null

                let cellCls: string
                if (isFuture) {
                  cellCls = 'border-border/30 bg-muted/20 text-muted-foreground/50'
                } else if (isToday && cfg) {
                  cellCls = `${cfg.border} ${cfg.bg} ${cfg.text} font-semibold ring-1 ring-offset-1 ring-current/30`
                } else if (isToday) {
                  cellCls = 'border-teal/60 bg-teal/15 font-semibold text-teal-700'
                } else if (cfg) {
                  cellCls = `${cfg.border} ${cfg.bg} ${cfg.text}`
                } else {
                  cellCls = 'border-border/30 bg-muted/10 text-muted-foreground/60'
                }

                return (
                  <div
                    key={i}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm ${cellCls}`}
                  >
                    <span>{cell.day}</span>
                    {cfg && !isFuture && (
                      <span className={`mt-0.5 inline-block size-1.5 rounded-full ${cfg.dot}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
