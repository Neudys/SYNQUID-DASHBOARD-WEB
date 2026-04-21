'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  LayoutDashboardIcon,
  ClockIcon,
  CpuIcon,
  UsersIcon,
  ShieldCheckIcon,
  LogOutIcon,
  Settings2Icon,
  CalendarIcon,
  CreditCardIcon,
  type LucideIcon,
} from 'lucide-react'
import { Role } from '@/lib/roles'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { LogoutDialog } from '@/components/logout-dialog'
import { cn } from '@/lib/utils'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  roles: readonly number[]
}

const ADMIN_ROLES = [Role.SuperAdmin, Role.Admin] as const
const ALL_ROLES = [Role.SuperAdmin, Role.Admin, Role.Professor] as const

const navItems: NavItem[] = [
  { title: 'Dashboard',  href: '/dashboard',             icon: LayoutDashboardIcon, roles: ALL_ROLES },
  { title: 'Calendar',   href: '/dashboard/calendar',    icon: CalendarIcon,        roles: ALL_ROLES },
  { title: 'Attendance', href: '/dashboard/attendance',  icon: ClockIcon,           roles: ADMIN_ROLES },
  { title: 'Readers',    href: '/dashboard/readers',     icon: CpuIcon,             roles: ADMIN_ROLES },
  { title: 'Users',      href: '/dashboard/users',       icon: UsersIcon,           roles: ADMIN_ROLES },
  { title: 'NFC',        href: '/dashboard/nfc',         icon: CreditCardIcon,      roles: ADMIN_ROLES },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole: number
}

export function AppSidebar({ userRole, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole))

  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.fromTo(
      '[data-sidebar-nav-item]',
      { opacity: 0, x: -8 },
      {
        opacity: 1,
        x: 0,
        duration: DURATION.standard,
        ease: EASE.out,
        stagger: STAGGER.tight,
        clearProps: 'opacity,transform',
      },
    )
  })

  return (
    <>
      <Sidebar collapsible="offcanvas" {...props}>
        {/* Header — brand logo */}
        <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
          <SidebarMenu>
            <SidebarMenuItem data-sidebar-nav-item>
              <SidebarMenuButton
                className="h-auto gap-3 p-1 transition-colors duration-150 ease-out"
                render={<Link href="/dashboard" />}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <ShieldCheckIcon className="size-4" />
                </div>
                <span className="text-base font-semibold text-sidebar-foreground">Synquid</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Nav */}
        <SidebarContent className="py-2">
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-widest text-[10px] px-4 mb-1">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleNavItems.map((item) => {
                  const active =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href} data-sidebar-nav-item>
                      <SidebarMenuButton
                        isActive={active}
                        render={<Link href={item.href} />}
                        className={cn(
                          'gap-3 text-sidebar-foreground/80 transition-colors duration-150 ease-out hover:text-sidebar-foreground hover:bg-sidebar-accent',
                          active &&
                            'bg-sidebar-accent text-sidebar-foreground font-medium',
                        )}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem data-sidebar-nav-item>
              <SidebarMenuButton
                className="gap-3 text-sidebar-foreground/80 transition-colors duration-150 ease-out hover:text-sidebar-foreground hover:bg-sidebar-accent"
                render={<Link href="/dashboard/settings" />}
              >
                <Settings2Icon className="size-4 shrink-0" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem data-sidebar-nav-item>
              <LogoutDialog>
                <SidebarMenuButton className="w-full cursor-pointer gap-3 text-sidebar-foreground/80 transition-colors duration-150 ease-out hover:text-sidebar-foreground hover:bg-sidebar-accent">
                  <LogOutIcon className="size-4 shrink-0" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </LogoutDialog>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
