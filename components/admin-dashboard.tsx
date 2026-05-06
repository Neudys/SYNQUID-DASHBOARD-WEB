'use client'

import useSWR from 'swr'
import { fetcher, POLL_INTERVAL } from '@/lib/fetcher'
import { DashboardStats } from '@/components/dashboard-stats'
import { RecentAttendance } from '@/components/recent-attendance'
import { API } from '@/lib/endpoints'

interface AttendanceRecord {
  id: string
  userId?: string
  deviceId?: string
  employeeName?: string
  userName?: string
  readerName?: string
  timestamp?: string
  timestampUtc?: string
  timestampLocal?: string
  createdAt?: string
  user?: { firstName?: string; name?: string; fullName?: string; email?: string }
  device?: { name?: string; deviceName?: string }
}

interface Reader {
  id: string
  isActive?: boolean
}

interface UsersResponse {
  users?: unknown[]
  totalUsers?: number
}

const SWR_OPTS = {
  refreshInterval: POLL_INTERVAL,
  dedupingInterval: 2_000,
  revalidateOnFocus: true,
  keepPreviousData: true,
} as const

function isTodayRecord(record: AttendanceRecord): boolean {
  const ts =
    record.timestampLocal ??
    record.timestampUtc ??
    record.timestamp ??
    record.createdAt
  if (!ts) return false
  const d = new Date(ts)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function resolveRecordNames(record: AttendanceRecord): AttendanceRecord {
  return {
    ...record,
    userName:
      record.user?.firstName ??
      record.user?.name ??
      record.user?.fullName ??
      record.userName ??
      record.employeeName,
    readerName:
      record.device?.name ??
      record.device?.deviceName ??
      record.readerName,
  }
}

export function AdminDashboard() {
  const { data: readersRaw } = useSWR<Reader[] | { items: Reader[] }>(
    API.readers,
    fetcher,
    SWR_OPTS,
  )

  const { data: usersRaw } = useSWR<UsersResponse | unknown[]>(
    API.users,
    fetcher,
    SWR_OPTS,
  )

  const { data: attendanceRaw } = useSWR<{
    records?: AttendanceRecord[]
    items?: AttendanceRecord[]
  } | AttendanceRecord[]>(
    API.attendanceAll,
    fetcher,
    SWR_OPTS,
  )

  const readers: Reader[] = Array.isArray(readersRaw)
    ? readersRaw
    : (readersRaw as { items?: Reader[] })?.items ?? []

  const activeReaders = readers.filter((r) => r.isActive !== false).length

  const totalUsers: number = Array.isArray(usersRaw)
    ? usersRaw.length
    : (usersRaw as UsersResponse)?.totalUsers ??
      (usersRaw as UsersResponse)?.users?.length ??
      0

  const allRecords: AttendanceRecord[] = Array.isArray(attendanceRaw)
    ? attendanceRaw
    : (attendanceRaw as { records?: AttendanceRecord[]; items?: AttendanceRecord[] })
        ?.records ??
      (attendanceRaw as { items?: AttendanceRecord[] })?.items ??
      []

  const enrichedRecords = allRecords.map(resolveRecordNames)
  const attendanceToday = enrichedRecords.filter(isTodayRecord).length
  const lastRecord = enrichedRecords.at(-1)
  const lastAttendanceAt =
    lastRecord?.timestampLocal ??
    lastRecord?.timestampUtc ??
    lastRecord?.timestamp ??
    lastRecord?.createdAt ??
    null

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-xl border border-border/60 bg-linear-to-br from-primary/5 via-card/60 to-teal/8 p-5 md:p-6 backdrop-blur-sm">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-teal/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-widest text-teal">Live overview</p>
          <h2 className="mt-1 text-xl md:text-2xl font-semibold text-foreground">
            Welcome back, let&apos;s see what&apos;s happening.
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Monitor readers, attendance activity, and team access in real time.
          </p>
        </div>
      </section>

      <DashboardStats
        activeReaders={readersRaw !== undefined ? activeReaders : undefined}
        attendanceToday={attendanceRaw !== undefined ? attendanceToday : undefined}
        totalUsers={usersRaw !== undefined ? totalUsers : undefined}
        lastAttendanceAt={attendanceRaw !== undefined ? lastAttendanceAt : undefined}
      />

      <RecentAttendance records={enrichedRecords} />
    </div>
  )
}
