'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Card, CardContent } from '@/components/ui/card'
import { CpuIcon, ClockIcon, UsersIcon, ActivityIcon, type LucideIcon } from 'lucide-react'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

interface Summary {
  activeReaders?: number
  attendanceToday?: number
  totalUsers?: number
  lastAttendanceAt?: string | null
}

interface DashboardStatsProps {
  summary: Summary | null
}

type Accent = 'forest' | 'teal' | 'sage' | 'moss'

interface Stat {
  label: string
  value: string | number
  icon: LucideIcon
  description: string
  accent: Accent
}

const accentMap: Record<Accent, { bg: string; text: string; ring: string }> = {
  forest: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    ring: 'group-hover:ring-primary/30',
  },
  teal: {
    bg: 'bg-teal/15',
    text: 'text-teal',
    ring: 'group-hover:ring-teal/40',
  },
  sage: {
    bg: 'bg-sage/40',
    text: 'text-forest',
    ring: 'group-hover:ring-sage/60',
  },
  moss: {
    bg: 'bg-moss/15',
    text: 'text-moss',
    ring: 'group-hover:ring-moss/40',
  },
}

export function DashboardStats({ summary }: DashboardStatsProps) {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '[data-stat-card]',
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.entrance,
          ease: EASE.out,
          stagger: STAGGER.loose,
          clearProps: 'opacity,transform',
        },
      )
    },
    { scope: container },
  )

  const stats: Stat[] = [
    {
      label: 'Active Readers',
      value: summary?.activeReaders ?? '—',
      icon: CpuIcon,
      description: 'Readers currently online',
      accent: 'teal',
    },
    {
      label: 'Attendance Today',
      value: summary?.attendanceToday ?? '—',
      icon: ClockIcon,
      description: 'Records logged today',
      accent: 'forest',
    },
    {
      label: 'Total Users',
      value: summary?.totalUsers ?? '—',
      icon: UsersIcon,
      description: 'Registered employees',
      accent: 'sage',
    },
    {
      label: 'Last Record',
      value: summary?.lastAttendanceAt
        ? new Date(summary.lastAttendanceAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '—',
      icon: ActivityIcon,
      description: summary?.lastAttendanceAt
        ? new Date(summary.lastAttendanceAt).toLocaleDateString()
        : 'No records yet',
      accent: 'moss',
    },
  ]

  return (
    <div ref={container} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const accent = accentMap[stat.accent]
        return (
          <Card
            key={stat.label}
            data-stat-card
            className={`group relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm ring-1 ring-transparent transition-all duration-250 ease-out hover:-translate-y-0.5 hover:shadow-md ${accent.ring}`}
          >
            <div className={`absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-current to-transparent opacity-30 ${accent.text}`} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ease-out ${accent.bg} ${accent.text}`}
                >
                  <stat.icon className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
