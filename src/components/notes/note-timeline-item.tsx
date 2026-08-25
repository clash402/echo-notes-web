import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
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
      <Card className="transition-colors hover:border-primary/40 hover:bg-accent/25">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl">{note.title}</CardTitle>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
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
