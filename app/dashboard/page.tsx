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
      <SiteHeader title="Dashboard" />
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <DashboardStats summary={summary} />
        <RecentAttendance records={recentAttendance} />
      </div>
    </div>
  )
}
