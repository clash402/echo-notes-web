'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Archive, Mic } from 'lucide-react'
import { MainNav } from '@/components/navigation/main-nav'
import { NoteTimelineItem } from '@/components/notes/note-timeline-item'
import { buttonVariants } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/error-banner'
import { Skeleton } from '@/components/ui/skeleton'
import { getNotes } from '@/lib/api/endpoints'
import { isApiError } from '@/lib/api/client'
import { createRequestId } from '@/lib/api/request-id'
import { queryKeys } from '@/lib/state/queryKeys'
import { cn } from '@/lib/utils'

export default function NotesPage() {
  const notesQuery = useQuery({
    queryKey: queryKeys.notes,
    queryFn: () => getNotes(createRequestId('get-notes')),
  })

  const notesError =
    notesQuery.error && isApiError(notesQuery.error)
      ? {
          message: notesQuery.error.message,
          requestId: notesQuery.error.requestId,
        }
      : notesQuery.error
        ? { message: 'Unable to load notes right now.' }
        : null

  return (
    <div className="pb-14">
      <MainNav current="notes" />

      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="border-b border-border pb-8">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Archive className="h-4 w-4" />Knowledge history</p>
          <h1 className="font-serif text-4xl tracking-[-0.025em] sm:text-5xl">Notes worth returning to.</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-6 text-muted-foreground">
            Review captured reasoning and follow the relationships between prior thoughts.
          </p>
        </section>

        {notesError && (
          <ErrorBanner
            message={notesError.message}
            requestId={notesError.requestId}
          />
        )}

        {notesQuery.isLoading ? (
          <section className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </section>
        ) : null}

        {notesQuery.data && notesQuery.data.length > 0 ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {notesQuery.data.map((note) => (
              <NoteTimelineItem key={note.id} note={note} />
            ))}
          </section>
        ) : null}

        {notesQuery.data && notesQuery.data.length === 0 && !notesError ? (
          <section className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <h2 className="font-serif text-2xl">Your knowledge history is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Capture your first thought to begin your timeline.
            </p>
            <Link
              href="/"
              className={cn(buttonVariants(), 'mt-5 inline-flex h-10 px-4')}
            >
              <Mic className="h-4 w-4" />
              Start recording
            </Link>
          </section>
        ) : null}
      </main>
    </div>
  )
}
