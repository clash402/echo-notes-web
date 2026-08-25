import { FileText } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type TranscriptPanelProps = {
  transcript?: string
  language?: string
  durationSeconds?: number
  loading?: boolean
}

export function TranscriptPanel({
  transcript,
  language,
  durationSeconds,
  loading,
}: TranscriptPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <FileText className="h-4 w-4" strokeWidth={1.75} />
          Transcript
        </CardDescription>
        <CardTitle className="text-xl">Captured transcript</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : transcript ? (
          <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
            {transcript}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Finish recording to see your transcript.
          </p>
        )}

        {(language || typeof durationSeconds === 'number') && (
          <div className="flex flex-wrap gap-4 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            {language && <span>Language: {language.toUpperCase()}</span>}
            {typeof durationSeconds === 'number' && (
              <span>Length: {durationSeconds.toFixed(1)}s</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
