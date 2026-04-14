import { SiteHeader } from '@/components/site-header'
import { UsersTable } from '@/components/users-table'

export default function UsersPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Users" />
      <div className="p-4 md:p-6">
        <UsersTable />
      </div>
    </div>
  )
}
