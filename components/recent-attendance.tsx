'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

gsap.registerPlugin(useGSAP)

const PAGE_SIZE = 5

interface AttendanceRecord {
  id: string
  employeeName?: string
  userName?: string
  readerName?: string
  timestamp?: string
  createdAt?: string
}

interface RecentAttendanceProps {
  records: AttendanceRecord[]
}

export function RecentAttendance({ records }: RecentAttendanceProps) {
  const container = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const pageRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      const tl = gsap.timeline({ defaults: { ease: EASE.out } })
      tl.fromTo(
        '[data-attendance-card]',
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.entrance,
          clearProps: 'opacity,transform',
        },
      )
      if (records.length > 0) {
        tl.fromTo(
          '[data-attendance-row]',
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: DURATION.standard,
            stagger: STAGGER.tight,
            clearProps: 'opacity,transform',
          },
          '-=0.2',
        )
      }
    },
    { scope: container, dependencies: [page] },
  )

  return (
    <div ref={container}>
      <Card
        data-attendance-card
        className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-colors duration-200 ease-out hover:border-teal/40"
      >
        <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-r from-teal/8 via-transparent to-sage/10 px-5 py-3.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-teal/15 text-teal">
            <ClockIcon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground">Recent Attendance</h2>
            <p className="text-xs text-muted-foreground">Latest check-ins across all readers</p>
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {records.length} {records.length === 1 ? 'record' : 'records'}
          </span>
        </div>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                <ClockIcon className="size-5" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">No attendance yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check-ins will appear here once readers start logging activity.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="text-xs uppercase tracking-wider">Employee</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Reader</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      data-attendance-row
                      className="border-border/40 transition-colors duration-150 ease-out hover:bg-secondary/40"
                    >
                      <TableCell className="font-medium">
                        {record.employeeName ?? record.userName ?? '—'}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-sage/30 px-2 py-0.5 text-xs font-medium text-forest dark:bg-sage/15 dark:text-sage">
                          {record.readerName ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                        {record.timestamp ?? record.createdAt
                          ? new Date(record.timestamp ?? record.createdAt!).toLocaleString()
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                  <p className="hidden text-sm text-muted-foreground lg:block tabular-nums">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, records.length)} of {records.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="hidden size-8 lg:flex cursor-pointer" disabled={page === 1} onClick={() => setPage(1)}>
                        <span className="sr-only">First page</span><ChevronsLeftIcon />
                      </Button>
                      <Button variant="outline" size="icon" className="size-8 cursor-pointer" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        <span className="sr-only">Previous page</span><ChevronLeftIcon />
                      </Button>
                      <Button variant="outline" size="icon" className="size-8 cursor-pointer" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                        <span className="sr-only">Next page</span><ChevronRightIcon />
                      </Button>
                      <Button variant="outline" size="icon" className="hidden size-8 lg:flex cursor-pointer" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
                        <span className="sr-only">Last page</span><ChevronsRightIcon />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
