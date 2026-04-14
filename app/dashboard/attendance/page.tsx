import { SiteHeader } from '@/components/site-header'
import { AttendanceTable } from '@/components/attendance-table'

export default function AttendancePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Attendance" />
      <div className="p-4 md:p-6">
        <AttendanceTable />
      </div>
    </div>
  )
}
