import { Settings2Icon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SettingsForm } from '@/components/settings-form'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

async function getCurrentUser() {
  try {
    const res = await backendFetch(BACKEND.auth.me)
    if (!res.ok) return null
    const data = await res.json()
    return data?.userData ?? data ?? null
  } catch {
    return null
  }
}

async function getInstitutionName(id?: string | null): Promise<string | null> {
  if (!id) return null
  try {
    const res = await backendFetch(BACKEND.institutions.detail(id))
    if (!res.ok) return null
    const data = await res.json()
    return data?.name ?? data?.institutionData?.name ?? null
  } catch {
    return null
  }
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const institutionName = await getInstitutionName(user?.institutionId ?? user?.InstitutionId)

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Settings"
        description="Manage your profile and preferences"
        icon={<Settings2Icon className="size-4" />}
      />
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <SettingsForm user={user} institutionName={institutionName} />
        </div>
      </div>
    </div>
  )
}
