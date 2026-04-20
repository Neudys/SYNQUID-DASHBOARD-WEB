import { CalendarIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { TeacherCalendar } from '@/components/teacher-calendar'
import { requireRole, Role } from '@/lib/auth'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'
import type { TeacherGroup } from '@/components/teacher-group-selector'

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

export default async function CalendarPage() {
  await requireRole([Role.SuperAdmin, Role.Admin, Role.Professor])
  const groups = await fetchGroups()

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Calendar"
        description="Review and update attendance by day"
        icon={<CalendarIcon className="size-4" />}
      />
      <div className="p-4 md:p-6 lg:p-8">
        <TeacherCalendar groups={groups} />
      </div>
    </div>
  )
}
