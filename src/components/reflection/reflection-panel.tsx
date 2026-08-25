import { Layers3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Reflection } from '@/lib/api/types'

const confidenceLabel: Record<'high' | 'medium' | 'low', string> = {
  high: 'Confidence: high',
  medium: 'Confidence: medium',
  low: 'Confidence: low',
}

type ReflectionPanelProps = {
  title?: string
  reflection?: Reflection
  confidence?: 'high' | 'medium' | 'low'
  loading?: boolean
}

const ReflectionList = ({
  items,
  emptyLabel,
}: {
  items: string[]
  emptyLabel: string
}) => {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-2 text-sm leading-relaxed text-foreground/90">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function ReflectionPanel({
  title,
  reflection,
  confidence,
  loading,
}: ReflectionPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <CardDescription className="flex items-center gap-2">
          <Layers3 className="h-4 w-4" strokeWidth={1.75} />
          Structured reflection
        </CardDescription>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl">{title || 'Review and preserve'}</CardTitle>
          {confidence && (
            <Badge variant="muted" className="font-normal">
              {confidenceLabel[confidence]}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-9/12" />
            <Skeleton className="h-4 w-8/12" />
          </div>
        ) : (
          <>
            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground/80">Summary</h4>
              <p className="text-sm leading-relaxed text-foreground/90">
                {reflection?.summary || 'Reflection will appear after transcription completes.'}
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground/80">Themes</h4>
              <ReflectionList
                items={reflection?.themes ?? []}
                emptyLabel="No clear themes yet."
              />
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground/80">Open questions</h4>
              <ReflectionList
                items={reflection?.questions ?? []}
                emptyLabel="No open tensions identified."
              />
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground/80">Possible next steps</h4>
              <ReflectionList
                items={reflection?.next_thoughts ?? []}
                emptyLabel="No next thoughts suggested yet."
              />
            </section>
          </>
        )}
      </CardContent>
    </Card>
  )
}
