type Entry = { data: unknown; ts: number }

const store = new Map<string, Entry>()
const DEFAULT_TTL = 5 * 60 * 1000 // 5 min

export const clientCache = {
  get<T>(key: string, ttl = DEFAULT_TTL): T | null {
    const e = store.get(key)
    if (!e) return null
    if (Date.now() - e.ts > ttl) { store.delete(key); return null }
    return e.data as T
  },
  set<T>(key: string, data: T): void {
    store.set(key, { data, ts: Date.now() })
  },
  del(key: string): void {
    store.delete(key)
  },
}
