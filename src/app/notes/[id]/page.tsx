'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Link2, Mic } from 'lucide-react'
import { AudioPlayer } from '@/components/audio/audio-player'
import { MainNav } from '@/components/navigation/main-nav'
import { ReflectionPanel } from '@/components/reflection/reflection-panel'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ErrorBanner } from '@/components/ui/error-banner'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getNoteById } from '@/lib/api/endpoints'
import { isApiError } from '@/lib/api/client'
import { createRequestId } from '@/lib/api/request-id'
import { queryKeys } from '@/lib/state/queryKeys'
import { formatTimelineDate } from '@/lib/utils/time'

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>()

  const noteId = useMemo(() => {
    if (!params?.id) {
      return ''
    }

    return Array.isArray(params.id) ? params.id[0] : params.id
  }, [params])

  const noteQuery = useQuery({
    queryKey: queryKeys.note(noteId),
    queryFn: () => getNoteById(noteId, createRequestId('get-note')),
    enabled: Boolean(noteId),
  })

  const noteError =
    noteQuery.error && isApiError(noteQuery.error)
      ? {
          message: noteQuery.error.message,
          requestId: noteQuery.error.requestId,
        }
      : noteQuery.error
        ? { message: 'Unable to load this note right now.' }
        : null

  return (
    <div className="pb-14">
      <MainNav current="detail" />

      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
          <div>
            <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-4xl">
              {noteQuery.data?.title || 'Note detail'}
            </h1>
            {noteQuery.data?.createdAt ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {formatTimelineDate(noteQuery.data.createdAt)}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/notes"
              className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-4')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to notes
            </Link>
            <Link href="/" className={cn(buttonVariants({ size: 'default' }), 'h-10 px-4')}>
              <Mic className="h-4 w-4" />
              Capture
            </Link>
          </div>
        </section>

        {noteError && (
          <ErrorBanner
            message={noteError.message}
            requestId={noteError.requestId}
          />
        )}

        {noteQuery.isLoading ? (
          <section className="space-y-3">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-64 w-full" />
          </section>
        ) : null}

        {noteQuery.data ? (
          <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardDescription>Transcript</CardDescription>
                  <CardTitle className="text-xl">Captured thought</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 sm:text-base">
                    {noteQuery.data.transcript || 'No transcript available.'}
                  </p>
                </CardContent>
              </Card>

              {(noteQuery.data.concepts.length > 0 || noteQuery.data.tags.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardDescription>Extracted concepts</CardDescription>
                    <CardTitle className="text-xl">Concepts and tags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {noteQuery.data.concepts.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Concepts</h3>
                        <div className="flex flex-wrap gap-2">
                          {noteQuery.data.concepts.map((concept) => (
                            <Badge key={concept} variant="outline">
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {noteQuery.data.tags.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {noteQuery.data.tags.map((tag) => (
                            <Badge key={tag} variant="muted">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {noteQuery.data.linkedNotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2"><Link2 className="h-4 w-4" />Context</CardDescription>
                    <CardTitle className="text-xl">Related notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {noteQuery.data.linkedNotes.map((linkedNote) => (
                      <Link
                        key={linkedNote.id}
                        href={`/notes/${linkedNote.id}`}
                        className="flex items-center justify-between rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm transition hover:border-primary/40 hover:bg-accent/30"
                      >
                        <span>{linkedNote.title}</span>
                        <span className="text-xs text-muted-foreground">Open</span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {noteQuery.data.audioUrl ? (
                <Card>
                  <CardHeader>
                    <CardDescription>Audio playback</CardDescription>
                    <CardTitle className="text-xl">Original recording</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AudioPlayer src={noteQuery.data.audioUrl} />
                  </CardContent>
                </Card>
              ) : null}

              <ReflectionPanel
                title={noteQuery.data.title}
                reflection={noteQuery.data.reflection}
                confidence={noteQuery.data.confidence}
              />
            </div>
          </section>
        ) : null}

        {!noteQuery.isLoading && !noteQuery.data && !noteError && (
          <section className="rounded-2xl border border-border bg-card px-6 py-8 text-center">
            <h2 className="font-serif text-2xl">Note unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This note may have been removed or is still syncing.
            </p>
            <Link
              href="/notes"
              className={cn(buttonVariants(), 'mt-4 inline-flex h-10 px-4')}
            >
              Return to timeline
            </Link>
          </section>
        )}
      </main>
    </div>
  )
}
