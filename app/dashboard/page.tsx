import { LayoutDashboardIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { DashboardStats } from '@/components/dashboard-stats'
import { RecentAttendance } from '@/components/recent-attendance'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

async function getSummary() {
  try {
    const res = await backendFetch(BACKEND.dashboard.summary)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getRecentAttendance() {
  try {
    const res = await backendFetch(`${BACKEND.attendance.list}?pageSize=5&page=1`)
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? data ?? []
  } catch {
    return []
  }
}

export default async function DashboardPage() {
  const [summary, recentAttendance] = await Promise.all([getSummary(), getRecentAttendance()])

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Dashboard"
        description="Overview of live activity and system health"
        icon={<LayoutDashboardIcon className="size-4" />}
      />
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Welcome / overview strip */}
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

        {/* KPIs */}
        <DashboardStats summary={summary} />

        {/* Recent attendance */}
        <RecentAttendance records={recentAttendance} />
      </div>
    </div>
  )
}
