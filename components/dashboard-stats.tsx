import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CpuIcon, ClockIcon, UsersIcon, ActivityIcon } from 'lucide-react'

interface Summary {
  activeReaders?: number
  attendanceToday?: number
  totalUsers?: number
  lastAttendanceAt?: string | null
}

interface DashboardStatsProps {
  summary: Summary | null
}

export function DashboardStats({ summary }: DashboardStatsProps) {
  const stats = [
    {
      label: 'Active Readers',
      value: summary?.activeReaders ?? '—',
      icon: CpuIcon,
      description: 'Readers currently online',
    },
    {
      label: 'Attendance Today',
      value: summary?.attendanceToday ?? '—',
      icon: ClockIcon,
      description: 'Records logged today',
    },
    {
      label: 'Total Users',
      value: summary?.totalUsers ?? '—',
      icon: UsersIcon,
      description: 'Registered employees',
    },
    {
      label: 'Last Record',
      value: summary?.lastAttendanceAt
        ? new Date(summary.lastAttendanceAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '—',
      icon: ActivityIcon,
      description: summary?.lastAttendanceAt
        ? new Date(summary.lastAttendanceAt).toLocaleDateString()
        : 'No records yet',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
