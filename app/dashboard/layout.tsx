import { getCurrentUser, requireAuth, Role } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === Role.Student) redirect('/unauthorized')

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" userRole={user.role} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
