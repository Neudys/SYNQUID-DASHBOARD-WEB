import { BuildingIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { InstitutionsTable } from '@/components/institutions-table'
import { requireRole, Role } from '@/lib/auth'

export default async function InstitutionsPage() {
  await requireRole([Role.SuperAdmin, Role.Admin])
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Institutions"
        description="Manage institutions and their members"
        icon={<BuildingIcon className="size-4" />}
      />
      <div className="p-4 md:p-6 lg:p-8">
        <InstitutionsTable />
      </div>
    </div>
  )
}
