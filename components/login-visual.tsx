'use client'

import { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ShieldCheckIcon, BarChart3Icon } from 'lucide-react'
import background from '@/app/images/background.png'

gsap.registerPlugin(useGSAP)

export function LoginVisual() {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return

      gsap.fromTo(
        '[data-visual-item]',
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
          delay: 0.1,
          clearProps: 'opacity,transform',
        },
      )
    },
    { scope: container },
  )

  return (
    <aside
      ref={container}
      className="relative hidden overflow-hidden bg-primary lg:block"
      aria-hidden="true"
    >
      {/* Background image */}
      <Image
        src={background}
        alt=""
        fill
        priority
        sizes="60vw"
        className="pointer-events-none select-none object-cover"
      />

      {/* Dark overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/90" />

      <div className="relative flex h-full flex-col justify-between p-12 text-white">
        <div data-visual-item className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-xl bg-teal/90 text-white shadow-lg shadow-teal/30 ring-1 ring-white/15">
            <ShieldCheckIcon className="size-8" strokeWidth={2.5} />
          </div>
          <span className="text-3xl font-bold tracking-tight text-white">Synquid</span>
        </div>

        <div className="max-w-lg space-y-6">
          <h2
            data-visual-item
            className="font-bold tracking-tight text-4xl leading-[1.1] text-white xl:text-5xl"
          >
            Control access.
            <br />
            <span className="text-teal">See the story</span> behind every tap.
          </h2>
          <p
            data-visual-item
            className="max-w-md text-base font-medium text-white/90 leading-relaxed"
          >
            A single dashboard for readers, attendance, and audit trails — built for teams that move fast.
          </p>
        </div>

        <div
          data-visual-item
          className="grid grid-cols-3 gap-6 border-t border-white/20 pt-8"
        >
          <Stat value="99.9%" label="Uptime" />
          <Stat value="<120ms" label="Sync latency" />
          <Stat
            value={<BarChart3Icon className="size-5" strokeWidth={2.5} />}
            label="Live analytics"
          />
        </div>
      </div>
    </aside>
  )
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex h-6 items-center text-xl font-bold tabular-nums text-teal">
        {value}
      </div>
      <div className="text-xs font-semibold uppercase tracking-wider text-white/75">
        {label}
      </div>
    </div>
  )
}
