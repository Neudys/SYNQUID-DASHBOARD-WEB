import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Attendance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {records.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">No attendance records yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Reader</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.employeeName ?? record.userName ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.readerName ?? '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {record.timestamp ?? record.createdAt
                      ? new Date(record.timestamp ?? record.createdAt!).toLocaleString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
