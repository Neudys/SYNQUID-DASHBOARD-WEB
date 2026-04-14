import { SiteHeader } from '@/components/site-header'
import { ReadersTable } from '@/components/readers-table'

export default function ReadersPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Readers" />
      <div className="p-4 md:p-6">
        <ReadersTable />
      </div>
    </div>
  )
}
