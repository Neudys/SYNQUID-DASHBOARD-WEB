export const DURATION = {
  quick: 0.15,
  standard: 0.25,
  entrance: 0.4,
  page: 0.3,
} as const

export const STAGGER = {
  tight: 0.05,
  normal: 0.08,
  loose: 0.1,
} as const

export const EASE = {
  out: 'power3.out',
  inOut: 'power2.inOut',
  spring: 'back.out(1.2)',
} as const

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
