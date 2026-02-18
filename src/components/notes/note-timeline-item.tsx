import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatTimelineDate } from '@/lib/utils/time'
import { truncateText } from '@/lib/utils/text'
import type { NoteSummary } from '@/lib/api/types'

type NoteTimelineItemProps = {
  note: NoteSummary
}

export function NoteTimelineItem({ note }: NoteTimelineItemProps) {
  return (
    <Link href={`/notes/${note.id}`} className="block">
      <Card className="transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl">{note.title}</CardTitle>
            <FiArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <CardDescription>{truncateText(note.reflectionSummary || 'No summary yet.', 120)}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Badge variant="outline" className="font-normal">
            {formatTimelineDate(note.createdAt)}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
