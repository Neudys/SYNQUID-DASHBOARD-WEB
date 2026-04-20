import { LayoutDashboardIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { DashboardStats } from '@/components/dashboard-stats'
import { RecentAttendance } from '@/components/recent-attendance'
import { TeacherDashboard } from '@/components/teacher-dashboard'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'
import { getCurrentUser, Role } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function getActiveReaders() {
  try {
    const res = await backendFetch(BACKEND.devices.list)
    if (!res.ok) return null
    const data = await res.json()
    return data?.length ?? null
  } catch {
    return null
  }
}

async function getAttendanceToday() {
  try {
    const now = new Date()
    const today = now.toISOString().slice(0, 19)

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 19)

    const res = await backendFetch(`${BACKEND.attendance.stats}?from=${yesterdayStr}&to=${today}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.totalRecords ?? null
  } catch {
    return null
  }
}

async function getAllAttendance() {
  try {
    const res = await backendFetch(BACKEND.attendance.all)
    if (!res.ok) return null
    const data = await res.json()

    for (const record of data) {
      const resU = await backendFetch(BACKEND.devices.detail(record.deviceId))
      const resD = await backendFetch(BACKEND.users.detail(record.userId))
      if (resU.ok) {
        const readerData = await resU.json()
        record.readerName = readerData.deviceInfo.name
      }
      if (resD.ok) {
        const userData = await resD.json()
        record.userName = userData.userData.firstName
      }
    }
    return data ?? null
  } catch {
    return null
  }
}

async function getTotalUsers() {
  try {
    const res = await backendFetch(BACKEND.users.list)
    if (!res.ok) return null
    const data = await res.json()
    return data?.users.length ?? null
  } catch {
    return null
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === Role.Student) redirect('/unauthorized')

  // Teacher flow
  if (user.role === Role.Professor) {
    const params = await searchParams
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader
          title="Dashboard"
          description="Your classes at a glance"
          icon={<LayoutDashboardIcon className="size-4" />}
        />
        <TeacherDashboard groupIdParam={params?.groupId} />
      </div>
    )
  }

  // Admin flow
  const [ActiveReaders, totalUsers, allAttendance, attendanceToday] = await Promise.all([
    getActiveReaders(),
    getTotalUsers(),
    getAllAttendance(),
    getAttendanceToday(),
  ])

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Dashboard"
        description="Overview of live activity and system health"
        icon={<LayoutDashboardIcon className="size-4" />}
      />
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
          activeReaders={ActiveReaders}
          attendanceToday={attendanceToday}
          totalUsers={totalUsers}
          lastAttendanceAt={allAttendance?.at(-1)?.timestampLocal ?? null}
        />

        <RecentAttendance records={allAttendance ?? []} />
      </div>
    </div>
  )
}
