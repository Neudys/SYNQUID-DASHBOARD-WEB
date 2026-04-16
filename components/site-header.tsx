'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { DURATION, EASE, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

interface SiteHeaderProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function SiteHeader({ title = 'Dashboard', description, icon, action }: SiteHeaderProps) {
  const container = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '[data-page-title]',
        { opacity: 0, y: -6 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.entrance,
          ease: EASE.out,
          clearProps: 'opacity,transform',
        },
      )
    },
    { scope: container },
  )

  return (
    <header
      ref={container}
      className="relative flex shrink-0 items-center gap-3 border-b border-border/60 bg-gradient-to-r from-secondary/40 via-background to-background/60 backdrop-blur-sm px-4 py-4 lg:px-6"
    >
      <SidebarTrigger className="-ml-1 cursor-pointer hover:bg-secondary transition-colors duration-150" />
      <Separator
        orientation="vertical"
        className="mx-1 h-5 data-vertical:self-auto"
      />
      <div data-page-title className="flex min-w-0 flex-1 items-center gap-3">
        {icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold leading-tight text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="ml-auto flex items-center gap-2">{action}</div>}
    </header>
  )
}
