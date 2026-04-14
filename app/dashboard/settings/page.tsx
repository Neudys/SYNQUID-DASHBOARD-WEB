import { SiteHeader } from '@/components/site-header'
import { SettingsForm } from '@/components/settings-form'
import { backendFetch } from '@/lib/api'
import { BACKEND } from '@/lib/endpoints'

async function getCurrentUser() {
  try {
    const res = await backendFetch(BACKEND.auth.me)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function SettingsPage() {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Settings" />
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <SettingsForm user={user} />
        </div>
      </div>
    </div>
  )
}
