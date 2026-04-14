import { LoginForm } from '@/components/login-form'
import { ShieldCheckIcon } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-cream p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium text-ink">
          <div className="flex size-8 items-center justify-center rounded-md bg-forest text-cream">
            <ShieldCheckIcon className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Synquid</span>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
