import { UsersIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { UsersTable } from '@/components/users-table'

export default function UsersPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Users"
        description="Manage team members, roles, and access"
        icon={<UsersIcon className="size-4" />}
      />
      <div className="p-4 md:p-6 lg:p-8">
        <UsersTable />
      </div>
    </div>
  )
}
