'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/loading-spinner'
import { CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon, BookOpenIcon, Clock3Icon } from 'lucide-react'
import { API } from '@/lib/endpoints'

interface AttendanceRecord {
  id: string
  status?: number
  date?: string
  timestamp?: string
  timestampLocal?: string
  groupName?: string
  subject?: string
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
  0: { label: 'Present',  color: 'text-teal bg-teal/15' },
  1: { label: 'Absent',   color: 'text-destructive bg-destructive/10' },
  2: { label: 'Excused',  color: 'text-primary bg-primary/10' },
}

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function formatDate(record: AttendanceRecord): string {
  const ts = record.timestampLocal ?? record.timestamp ?? record.date
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  // e.g. "08:00:00" -> "08:00"
  const parts = timeStr.split(':')
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
  return timeStr
}

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'faltas' | 'clases'>('faltas')

  // Faltas state
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loadingFaltas, setLoadingFaltas] = useState(true)

  // Clases state
  const [groups, setGroups] = useState<Group[]>([])
  // Map of groupId -> Schedule[]
  const [schedulesMap, setSchedulesMap] = useState<Record<string, Schedule[]>>({})
  const [loadingClases, setLoadingClases] = useState(false)
  const [clasesFetched, setClasesFetched] = useState(false)

  // Fetch Faltas initially
  useEffect(() => {
    fetch('/api/attendance/my')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoadingFaltas(false))
  }, [])

  // Fetch Clases when switching tab
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
          }

          // Fetch schedules for all groups in parallel
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
              })
            )
            setSchedulesMap(newSchedulesMap)
          }
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingClases(false)
          setClasesFetched(true)
        }
      }
      fetchClases()
    }
  }, [activeTab, clasesFetched])

  const present  = records.filter((r) => r.status === 0).length
  const absent   = records.filter((r) => r.status === 1).length
  const excused  = records.filter((r) => r.status === 2).length
  const total    = records.length

  if (loadingFaltas && activeTab === 'faltas') return <LoadingSpinner />

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Tabs / Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('faltas')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
            activeTab === 'faltas' 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          Faltas
        </button>
        <button
          onClick={() => setActiveTab('clases')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
            activeTab === 'clases' 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          Mis Clases
        </button>
      </div>

      {activeTab === 'faltas' && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-teal/15 text-teal">
                  <CheckCircleIcon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{present}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Present</p>
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Absences</p>
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Excused</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance list */}
          <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-r from-primary/8 via-transparent to-teal/10 px-5 py-3.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarIcon className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Historial de Asistencia</h2>
                <p className="text-xs text-muted-foreground">{total} registro{total !== 1 ? 's' : ''} en total</p>
              </div>
            </div>
            <CardContent className="p-0">
              {records.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No hay registros de asistencia todavía.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {records.slice().reverse().map((r) => {
                    const s = STATUS_LABEL[r.status ?? 1]
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-3">
                        <span className="text-sm text-foreground">{formatDate(r)}</span>
                        {r.groupName && (
                          <span className="hidden text-xs text-muted-foreground sm:block">{r.groupName}</span>
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
              <p className="mt-1 text-xs text-muted-foreground">Cuando un profesor te agregue a un grupo, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const groupSchedules = schedulesMap[group.groupId] || []
                return (
                  <Card key={group.groupId} className="flex flex-col overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-colors hover:border-primary/40">
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
                            <li key={sch.scheduleId} className="flex items-center justify-between text-sm bg-card/50 rounded-md p-2 border border-border/40">
                              <span className="font-medium text-foreground">{DAYS_OF_WEEK[sch.dayOfWeek] || sch.dayOfWeek}</span>
                              <span className="text-muted-foreground tabular-nums">{formatTime(sch.startTime)} - {formatTime(sch.endTime)}</span>
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
    </div>
  )
}
