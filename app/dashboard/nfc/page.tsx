import { CreditCardIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { NfcTable } from '@/components/nfc-table'
import { requireRole, Role } from '@/lib/auth'

export default async function NfcPage() {
  await requireRole([Role.SuperAdmin, Role.Admin])
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="NFC Cards"
        description="Assign and manage NFC cards linked to students"
        icon={<CreditCardIcon className="size-4" />}
      />
      <div className="p-4 md:p-6 lg:p-8">
        <NfcTable />
      </div>
    </div>
  )
}
