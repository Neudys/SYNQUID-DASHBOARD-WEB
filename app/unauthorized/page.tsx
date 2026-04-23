import Link from 'next/link'
import { ShieldAlertIcon, ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-md flex-col items-center rounded-xl border border-border/60 bg-card/80 px-6 py-10 text-center backdrop-blur-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlertIcon className="size-7" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-foreground">Access denied</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          You don&apos;t have permission to view this page. If you believe this is a mistake,
          contact your administrator.
        </p>
        <Button
          className="mt-6 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          render={<Link href="/dashboard" />}
          nativeButton={false}
        >
          <ArrowLeftIcon className="size-4" />
          Back to dashboard
        </Button>
      </div>
    </div>
  )
}
