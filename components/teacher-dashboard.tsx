import { UsersIcon, ClockIcon, CheckCircleIcon, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'
import { TeacherGroupSelector, type TeacherGroup } from '@/components/teacher-group-selector'

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

async function fetchGroups(): Promise<TeacherGroup[]> {
  try {
    const res = await backendFetch(BACKEND.teacher.myGroups)
    if (!res.ok) return []
    const body = await res.json()
    return Array.isArray(body?.data) ? body.data : []
  } catch {
    return []
  }
}

async function fetchStudents(groupId: string): Promise<Student[]> {
  try {
    const res = await backendFetch(`${BACKEND.teacher.groupStudents(groupId)}?page=1&limit=100`)
    if (!res.ok) return []
    const body = await res.json()
    return Array.isArray(body?.data) ? body.data : []
  } catch {
    return []
  }
}

async function fetchToday(groupId: string): Promise<AttendanceRecord[]> {
  try {
    const res = await backendFetch(`${BACKEND.attendance.today}?groupId=${groupId}`)
    if (!res.ok) return []
    const body = await res.json()
    return Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
  } catch {
    return []
  }
}

async function fetchHistory(groupId: string): Promise<AttendanceRecord[]> {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const res = await backendFetch(
      `${BACKEND.attendance.history}?groupId=${groupId}&from=${today}&to=${today}&page=1&limit=20`,
    )
    if (!res.ok) return []
    const body = await res.json()
    return Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
  } catch {
    return []
  }
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

export async function TeacherDashboard({ groupIdParam }: { groupIdParam?: string }) {
  const groups = await fetchGroups()
  const activeGroupId = groupIdParam && groups.some((g) => g.groupId === groupIdParam)
    ? groupIdParam
    : groups[0]?.groupId ?? null

  const [students, todayRecords, historyRecords] = activeGroupId
    ? await Promise.all([
        fetchStudents(activeGroupId),
        fetchToday(activeGroupId),
        fetchHistory(activeGroupId),
      ])
    : [[], [], []]

  const presentToday = todayRecords.filter((r) => r.status === 0 || r.status === undefined).length
  const totalStudents = students.length
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
              value={totalStudents}
              description="Students in this class"
              accent={{ bg: 'bg-teal/15', text: 'text-teal' }}
            />
            <StatCard
              icon={CheckCircleIcon}
              label="Present today"
              value={presentToday}
              description="Checked in today"
              accent={{ bg: 'bg-primary/10', text: 'text-primary' }}
            />
            <StatCard
              icon={ClockIcon}
              label="Absent today"
              value={absentToday}
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
              {students.length === 0 ? (
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
              {historyRecords.length === 0 ? (
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
                          : students.find((s) => s.userId === r.userId)
                            ? `${students.find((s) => s.userId === r.userId)!.firstName} ${students.find((s) => s.userId === r.userId)!.lastName}`
                            : '—'
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
