'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Archive, LoaderCircle, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { AudioPlayer } from '@/components/audio/audio-player'
import { MainNav } from '@/components/navigation/main-nav'
import {
  formatDurationMs,
  useAudioRecorder,
} from '@/components/record/use-audio-recorder'
import { ReflectionPanel } from '@/components/reflection/reflection-panel'
import { TranscriptPanel } from '@/components/transcript/transcript-panel'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/error-banner'
import { RecordButton } from '@/components/record/record-button'
import { createRequestId } from '@/lib/api/request-id'
import { isApiError } from '@/lib/api/client'
import {
  createEchoReflection,
  saveNote,
  transcribeAudio,
} from '@/lib/api/endpoints'
import { queryKeys } from '@/lib/state/queryKeys'
import type { EchoData, TranscriptionData } from '@/lib/api/types'

type UserFacingError = {
  message: string
  requestId?: string
}

const fallbackErrorMessage = 'Something went wrong. Please try again.'

const toUserFacingError = (error: unknown): UserFacingError => {
  if (isApiError(error)) {
    return {
      message: error.message || fallbackErrorMessage,
      requestId: error.requestId,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message || fallbackErrorMessage,
    }
  }

  return {
    message: fallbackErrorMessage,
  }
}

export default function CapturePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [transcription, setTranscription] = useState<TranscriptionData | null>(null)
  const [echo, setEcho] = useState<EchoData | null>(null)
  const [captureError, setCaptureError] = useState<UserFacingError | null>(null)

  const {
    status,
    error: recorderError,
    audioBlob,
    audioUrl,
    durationMs,
    isRecording,
    canRecord,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder()

  const transcribeMutation = useMutation({
    mutationFn: ({ blob, requestId }: { blob: Blob; requestId: string }) => {
      return transcribeAudio({ audioBlob: blob, requestId })
    },
  })

  const echoMutation = useMutation({
    mutationFn: ({ transcript, requestId }: { transcript: string; requestId: string }) => {
      return createEchoReflection({ transcript, requestId })
    },
  })

  const saveMutation = useMutation({
    mutationFn: ({
      transcript,
      reflection,
      requestId,
    }: {
      transcript: string
      reflection: EchoData['reflection']
      requestId: string
    }) => {
      return saveNote({
        transcript,
        reflection,
        requestId,
      })
    },
  })

  const clearDerivedData = () => {
    setTranscription(null)
    setEcho(null)
    setCaptureError(null)
    transcribeMutation.reset()
    echoMutation.reset()
    saveMutation.reset()
  }

  const resetSession = () => {
    resetRecording()
    clearDerivedData()
  }

  const handleProcessRecording = async (blob: Blob) => {
    const transcribeRequestId = createRequestId('transcribe')
    const transcriptionResult = await transcribeMutation.mutateAsync({
      blob,
      requestId: transcribeRequestId,
    })

    setTranscription(transcriptionResult)

    const echoRequestId = createRequestId('echo')
    const echoResult = await echoMutation.mutateAsync({
      transcript: transcriptionResult.transcript,
      requestId: echoRequestId,
    })

    setEcho(echoResult)
  }

  const handleRecordClick = async () => {
    setCaptureError(null)

    if (isRecording) {
      const blob = await stopRecording()

      if (!blob) {
        return
      }

      try {
        await handleProcessRecording(blob)
      } catch (error) {
        setCaptureError(toUserFacingError(error))
      }

      return
    }

    clearDerivedData()
    resetRecording()

    try {
      await startRecording()
    } catch (error) {
      setCaptureError(toUserFacingError(error))
    }
  }

  const handleSaveNote = async () => {
    if (!transcription || !echo) {
      return
    }

    setCaptureError(null)

    try {
      const requestId = createRequestId('save-note')
      const savedNote = await saveMutation.mutateAsync({
        transcript: transcription.transcript,
        reflection: echo.reflection,
        requestId,
      })

      await queryClient.invalidateQueries({ queryKey: queryKeys.notes })
      router.push(`/notes/${savedNote.id}`)
    } catch (error) {
      setCaptureError(toUserFacingError(error))
    }
  }

  const handleRerecord = async () => {
    if (isBusy) {
      return
    }

    resetSession()

    try {
      await startRecording()
    } catch (error) {
      setCaptureError(toUserFacingError(error))
    }
  }

  const isBusy =
    transcribeMutation.isPending ||
    echoMutation.isPending ||
    saveMutation.isPending ||
    status === 'stopping'

  const statusLabel = useMemo(() => {
    if (isRecording) {
      return 'Recording in progress…'
    }

    if (transcribeMutation.isPending) {
      return 'Recording complete. Transcribing…'
    }

    if (echoMutation.isPending) {
      return 'Structuring the reflection…'
    }

    if (saveMutation.isPending) {
      return 'Saving note…'
    }

    if (echo) {
      return 'Reflection ready to review and save.'
    }

    if (audioBlob) {
      return 'Processing complete. Review your reflection below.'
    }

    return 'Record for 30–120 seconds. Nothing is saved until you approve it.'
  }, [
    audioBlob,
    echo,
    echoMutation.isPending,
    isRecording,
    saveMutation.isPending,
    transcribeMutation.isPending,
  ])

  const activeError = captureError
    ? captureError
    : recorderError
      ? { message: recorderError }
      : null

  return (
    <div className="pb-14">
      <MainNav current="capture" />

      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="border-b border-border pb-8">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Archive className="h-4 w-4" strokeWidth={1.75} />
            Durable capture
          </p>
          <h1 className="max-w-3xl font-serif text-4xl leading-[1.08] tracking-[-0.025em] sm:text-5xl">
            Preserve the reasoning behind the decision.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-6 text-muted-foreground">
            Capture a thought, review the transcript and structured reflection, then
            choose what becomes part of your knowledge history.
          </p>
        </header>

        <section className="fade-up overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col justify-between p-6 sm:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">New capture</p>
                <h2 className="mt-3 font-serif text-3xl leading-tight">Speak naturally. Review before saving.</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Echo Notes transcribes your recording and extracts its themes, open
                  questions, and possible next thoughts.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Human approval remains the save boundary
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-5 border-t border-border bg-[hsl(var(--ghost-blush)/0.45)] p-7 lg:border-l lg:border-t-0">
            <RecordButton
              isRecording={isRecording}
              disabled={!canRecord || isBusy}
              onClick={handleRecordClick}
            />

            <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm">
              <span className="inline-flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-foreground/85">
                {(isRecording || isBusy) && (
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                )}
                {statusLabel}
              </span>
              <span className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs font-medium tabular-nums text-foreground/85">
                {formatDurationMs(durationMs)}
              </span>
            </div>

            {activeError && (
              <ErrorBanner
                message={activeError.message}
                requestId={activeError.requestId}
                className="w-full text-left"
              />
            )}

            {audioUrl && (
              <div className="w-full rounded-xl border border-border bg-card p-4">
                <p className="mb-2 text-left text-sm text-muted-foreground">Recording preview</p>
                <AudioPlayer src={audioUrl} />
              </div>
            )}

            {audioBlob && (
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  onClick={handleSaveNote}
                  disabled={!transcription || !echo || isBusy}
                  className="h-11"
                >
                  <Archive className="h-4 w-4" />
                  Save note
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRerecord}
                  disabled={isBusy}
                  className="h-11"
                >
                  <RefreshCw className="h-4 w-4" />
                  Re-record
                </Button>
                <Button
                  variant="ghost"
                  onClick={resetSession}
                  disabled={isBusy}
                  className="h-11"
                >
                  <Trash2 className="h-4 w-4" />
                  Discard
                </Button>
              </div>
            )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 pb-4 lg:grid-cols-2">
          <TranscriptPanel
            transcript={transcription?.transcript}
            language={transcription?.language}
            durationSeconds={transcription?.duration_s}
            loading={transcribeMutation.isPending}
          />
          <ReflectionPanel
            title={echo?.title}
            reflection={echo?.reflection}
            confidence={echo?.confidence}
            loading={echoMutation.isPending}
          />
        </section>
      </main>
    </div>
  )
}
