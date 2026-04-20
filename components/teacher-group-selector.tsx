'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface TeacherGroup {
  groupId: string
  groupName: string
  studentCount?: number
  description?: string
}

interface Props {
  groups: TeacherGroup[]
  activeGroupId: string | null
}

export function TeacherGroupSelector({ groups, activeGroupId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(value: string | null) {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('groupId', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        You don&apos;t have any groups assigned yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Active class
      </label>
      <Select value={activeGroupId ?? undefined} onValueChange={handleChange}>
        <SelectTrigger className="w-full max-w-md bg-card/80 backdrop-blur-sm">
          <SelectValue placeholder="Select a class" />
        </SelectTrigger>
        <SelectContent>
          {groups.map((g) => (
            <SelectItem key={g.groupId} value={g.groupId}>
              <span className="font-medium">{g.groupName}</span>
              {typeof g.studentCount === 'number' && (
                <span className="ml-2 text-xs text-muted-foreground">
                  · {g.studentCount} {g.studentCount === 1 ? 'student' : 'students'}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
