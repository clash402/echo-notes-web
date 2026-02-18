'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { FiMic } from 'react-icons/fi'
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

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 sm:px-8">
        <section className="rounded-3xl border border-border/70 bg-white/75 px-6 py-7 shadow-sm backdrop-blur sm:px-8">
          <h1 className="font-serif text-4xl">Your timeline</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Revisit reflections in reverse chronological order.
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
          <section className="grid gap-4">
            {notesQuery.data.map((note) => (
              <NoteTimelineItem key={note.id} note={note} />
            ))}
          </section>
        ) : null}

        {notesQuery.data && notesQuery.data.length === 0 && !notesError ? (
          <section className="rounded-3xl border border-dashed border-border bg-white/65 px-6 py-10 text-center">
            <h2 className="font-serif text-2xl">No notes yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Capture your first thought to begin your timeline.
            </p>
            <Link
              href="/"
              className={cn(buttonVariants(), 'mt-5 inline-flex h-10 px-4')}
            >
              <FiMic className="h-4 w-4" />
              Start recording
            </Link>
          </section>
        ) : null}
      </main>
    </div>
  )
}
