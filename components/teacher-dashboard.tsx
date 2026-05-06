'use client'

import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { UsersIcon, ClockIcon, CheckCircleIcon, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TeacherGroupSelector, type TeacherGroup } from '@/components/teacher-group-selector'
import { fetcher, POLL_INTERVAL } from '@/lib/fetcher'

interface Student {
  userId: string
  firstName: string
  lastName: string
  email: string
  nfcCardId?: string
  nfcCardUid?: string
}

interface AttendanceRecord {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  status?: number
  timestamp?: string
  timestampLocal?: string
}

const SWR_POLL = {
  refreshInterval: POLL_INTERVAL,
  dedupingInterval: 2_000,
  revalidateOnFocus: true,
  keepPreviousData: true,
} as const

function toArray<T>(raw: unknown): T[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as T[]
  const r = raw as Record<string, unknown>
  if (Array.isArray(r.data)) return r.data as T[]
  if (Array.isArray(r.groups)) return r.groups as T[]
  if (Array.isArray(r.students)) return r.students as T[]
  if (Array.isArray(r.attendances)) return r.attendances as T[]
  return []
}

export function TeacherDashboard() {
  const searchParams = useSearchParams()
  const urlGroupId = searchParams.get('groupId')

  // Groups — light poll, changes rarely
  const { data: groupsRaw } = useSWR(
    '/api/teacher/myGroups',
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5_000 },
  )
  const groups: TeacherGroup[] = toArray<TeacherGroup>(groupsRaw)

  const activeGroupId =
    urlGroupId && groups.some((g) => g.groupId === urlGroupId)
      ? urlGroupId
      : groups[0]?.groupId ?? null

  const today = new Date().toISOString().slice(0, 10)

  // Students in the active group — poll to catch new enrollments
  const { data: studentsRaw, isLoading: studentsLoading } = useSWR(
    activeGroupId
      ? `/api/teacher/groups/${activeGroupId}/students?page=1&limit=100`
      : null,
    fetcher,
    SWR_POLL,
  )

  // Today's history records (timestamps + names) — poll actively, high limit to count all
  const { data: historyRaw } = useSWR(
    activeGroupId
      ? `/api/attendance/history?groupId=${activeGroupId}&from=${today}&to=${today}&page=1&limit=500`
      : null,
    fetcher,
    SWR_POLL,
  )

  const students: Student[] = toArray<Student>(studentsRaw)
  const historyRecords: AttendanceRecord[] = toArray<AttendanceRecord>(historyRaw)

  const totalStudents = students.length
  const presentToday = historyRecords.filter((r) => r.status === 0 || r.status === 3).length
  const absentToday = Math.max(0, totalStudents - presentToday)
  const activeGroup = groups.find((g) => g.groupId === activeGroupId)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Welcome strip */}
      <section className="relative overflow-hidden rounded-xl border border-border/60 bg-linear-to-br from-primary/5 via-card/60 to-teal/8 p-5 md:p-6 backdrop-blur-sm">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-teal/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-widest text-teal">Teacher overview</p>
          <h2 className="mt-1 text-xl md:text-2xl font-semibold text-foreground">
            Welcome back{activeGroup ? `, ${activeGroup.groupName}` : ''}.
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Monitor today&apos;s attendance across your classes.
          </p>
        </div>
      </section>

      {/* Group selector */}
      <TeacherGroupSelector groups={groups} activeGroupId={activeGroupId} />

      {activeGroupId && (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={UsersIcon}
              label="Enrolled"
              value={studentsLoading ? '—' : totalStudents}
              description="Students in this class"
              accent={{ bg: 'bg-teal/15', text: 'text-teal' }}
            />
            <StatCard
              icon={CheckCircleIcon}
              label="Present today"
              value={studentsLoading ? '—' : presentToday}
              description="Checked in today"
              accent={{ bg: 'bg-primary/10', text: 'text-primary' }}
            />
            <StatCard
              icon={ClockIcon}
              label="Absent today"
              value={studentsLoading ? '—' : absentToday}
              description="Not checked in yet"
              accent={{ bg: 'bg-moss/15', text: 'text-moss' }}
            />
          </div>

          {/* Students list */}
          <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-r from-teal/8 via-transparent to-sage/10 px-5 py-3.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-teal/15 text-teal">
                <UsersIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-foreground">Students</h2>
                <p className="text-xs text-muted-foreground">Members of the selected class</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {totalStudents} {totalStudents === 1 ? 'student' : 'students'}
              </span>
            </div>
            <CardContent className="p-0">
              {studentsLoading ? (
                <div className="flex flex-col divide-y divide-border/40">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ))}
                </div>
              ) : students.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No students enrolled in this class yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="text-xs uppercase tracking-wider">Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Email</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-right">NFC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.userId} className="border-border/40">
                        <TableCell className="font-medium">
                          {s.firstName} {s.lastName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                          {s.nfcCardUid ? s.nfcCardUid.slice(0, 12) + '…' : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent attendance today */}
          <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-r from-primary/8 via-transparent to-teal/10 px-5 py-3.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClockIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-foreground">Today&apos;s check-ins</h2>
                <p className="text-xs text-muted-foreground">Most recent attendance for this class</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {historyRecords.length} {historyRecords.length === 1 ? 'record' : 'records'}
              </span>
            </div>
            <CardContent className="p-0">
              {studentsLoading ? (
                <div className="flex flex-col divide-y divide-border/40">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No attendance recorded today yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="text-xs uppercase tracking-wider">Student</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRecords.slice(0, 10).map((r) => {
                      const studentName =
                        r.firstName || r.lastName
                          ? `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()
                          : (() => {
                              const s = students.find((s) => s.userId === r.userId)
                              return s ? `${s.firstName} ${s.lastName}` : '—'
                            })()
                      const when = r.timestampLocal ?? r.timestamp
                      return (
                        <TableRow key={r.id} className="border-border/40">
                          <TableCell className="font-medium">{studentName}</TableCell>
                          <TableCell>
                            <StatusBadge status={r.status} />
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                            {when ? new Date(when).toLocaleString() : '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  description: string
  accent: { bg: string; text: string }
}) {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accent.bg} ${accent.text}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status?: number }) {
  const map: Record<number, { label: string; className: string }> = {
    0: { label: 'Present', className: 'bg-primary/10 text-primary dark:bg-primary/20' },
    1: { label: 'Absent', className: 'bg-destructive/10 text-destructive' },
    2: { label: 'Excused', className: 'bg-moss/15 text-moss' },
  }
  const v = map[status ?? 0] ?? { label: '—', className: 'bg-muted text-muted-foreground' }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${v.className}`}>
      {v.label}
    </span>
  )
}
