type Entry = { data: unknown; ts: number }

const DEFAULT_TTL = 5 * 60 * 1000 // 5 min

export const clientCache = {
  get<T>(key: string, ttl = DEFAULT_TTL): T | null {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem(`clientCache_${key}`)
      if (!stored) return null
      const e = JSON.parse(stored) as Entry
      if (Date.now() - e.ts > ttl) {
        localStorage.removeItem(`clientCache_${key}`)
        return null
      }
      return e.data as T
    } catch {
      return null
    }
  },
  set<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(`clientCache_${key}`, JSON.stringify({ data, ts: Date.now() }))
    } catch {}
  },
  del(key: string): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(`clientCache_${key}`)
    } catch {}
  },
}
