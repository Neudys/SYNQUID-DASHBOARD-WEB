import { CpuIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { ReadersTable } from '@/components/readers-table'
import { requireRole, Role } from '@/lib/auth'

export default async function ReadersPage() {
  await requireRole([Role.SuperAdmin, Role.Admin])
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Readers"
        description="Configure devices that capture attendance"
        icon={<CpuIcon className="size-4" />}
      />
      <div className="p-4 md:p-6 lg:p-8">
        <ReadersTable />
      </div>
    </div>
  )
}
