import { GraduationCapIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { GroupsGrid } from '@/components/groups-grid'
import { requireRole, Role } from '@/lib/auth'

export default async function GroupsPage() {
  await requireRole([Role.SuperAdmin, Role.Admin])
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Groups"
        description="Manage classes, assign professors and students"
        icon={<GraduationCapIcon className="size-4" />}
      />
      <div className="p-4 md:p-6 lg:p-8">
        <GroupsGrid />
      </div>
    </div>
  )
}
