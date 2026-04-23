'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/loading-spinner'
import { CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from 'lucide-react'

interface AttendanceRecord {
  id: string
  status?: number
  date?: string
  timestamp?: string
  timestampLocal?: string
  groupName?: string
  subject?: string
}

const STATUS_LABEL: Record<number, { label: string; color: string }> = {
  0: { label: 'Present',  color: 'text-teal bg-teal/15' },
  1: { label: 'Absent',   color: 'text-destructive bg-destructive/10' },
  2: { label: 'Excused',  color: 'text-primary bg-primary/10' },
}

function formatDate(record: AttendanceRecord): string {
  const ts = record.timestampLocal ?? record.timestamp ?? record.date
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function StudentDashboard() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/attendance/my')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  const present  = records.filter((r) => r.status === 0).length
  const absent   = records.filter((r) => r.status === 1).length
  const excused  = records.filter((r) => r.status === 2).length
  const total    = records.length

  if (loading) return <LoadingSpinner />

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
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
    </div>
  )
}
