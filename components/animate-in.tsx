'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

interface AnimateInProps {
  children: React.ReactNode
  as?: keyof React.JSX.IntrinsicElements
  className?: string
  /** CSS selector within scope to stagger. If unset, animates the root element. */
  staggerSelector?: string
  delay?: number
  stagger?: number
  duration?: number
  y?: number
}

export function AnimateIn({
  children,
  as: Tag = 'div',
  className,
  staggerSelector,
  delay = 0,
  stagger = STAGGER.normal,
  duration = DURATION.entrance,
  y = 12,
}: AnimateInProps) {
  const container = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      const target = staggerSelector ?? container.current
      if (!target) return

      gsap.fromTo(
        target,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: EASE.out,
          stagger: staggerSelector ? stagger : 0,
          clearProps: 'opacity,transform',
        },
      )
    },
    { scope: container },
  )

  const Component = Tag as React.ElementType
  return (
    <Component ref={container} className={className}>
      {children}
    </Component>
  )
}
