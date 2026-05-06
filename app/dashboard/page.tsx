import { Suspense } from 'react'
import { LayoutDashboardIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { AdminDashboard } from '@/components/admin-dashboard'
import { TeacherDashboard } from '@/components/teacher-dashboard'
import { StudentDashboard } from '@/components/student-dashboard'
import { getCurrentUser, Role } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (user.role === Role.Student) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader
          title="Faltas & Clases"
          description="Tu historial de asistencia"
          icon={<LayoutDashboardIcon className="size-4" />}
        />
        <StudentDashboard />
      </div>
    )
  }

  if (user.role === Role.Professor) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader
          title="Dashboard"
          description="Your classes at a glance"
          icon={<LayoutDashboardIcon className="size-4" />}
        />
        <Suspense>
          <TeacherDashboard />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Dashboard"
        description="Overview of live activity and system health"
        icon={<LayoutDashboardIcon className="size-4" />}
      />
      <AdminDashboard />
    </div>
  )
}
