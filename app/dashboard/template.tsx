'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { DURATION, EASE, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.entrance,
          ease: EASE.out,
          clearProps: 'opacity,transform',
        },
      )
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className="flex flex-1 flex-col">
      {children}
    </div>
  )
}
