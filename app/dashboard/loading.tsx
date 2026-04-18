import { LayoutDashboardIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="size-10 shrink-0 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Dashboard"
        description="Overview of live activity and system health"
        icon={<LayoutDashboardIcon className="size-4" />}
      />
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Welcome strip */}
        <section className="relative overflow-hidden rounded-xl border border-border/60 bg-linear-to-br from-primary/5 via-card/60 to-teal/8 p-5 md:p-6 backdrop-blur-sm">
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-teal/10 blur-3xl" />
          <div className="relative space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </section>

        {/* KPI skeletons */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Recent attendance skeleton */}
        <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-r from-teal/8 via-transparent to-sage/10 px-5 py-3.5">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="ml-auto h-4 w-28" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
