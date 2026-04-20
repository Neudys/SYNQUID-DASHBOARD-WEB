import { ClockIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { AttendanceTable } from '@/components/attendance-table'
import { requireRole, Role } from '@/lib/auth'

export default async function AttendancePage() {
  await requireRole([Role.SuperAdmin, Role.Admin])
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Attendance"
        description="Browse and filter check-in activity across readers"
        icon={<ClockIcon className="size-4" />}
      />
      <div className="p-4 md:p-6 lg:p-8">
        <AttendanceTable />
      </div>
    </div>
  )
}
