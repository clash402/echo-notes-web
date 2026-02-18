'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { FiLoader, FiRefreshCw, FiSave, FiTrash2 } from 'react-icons/fi'
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
      return 'Listening...'
    }

    if (transcribeMutation.isPending) {
      return 'Listening complete. Transcribing...'
    }

    if (echoMutation.isPending) {
      return 'Reflecting on your thought...'
    }

    if (saveMutation.isPending) {
      return 'Saving note...'
    }

    if (echo) {
      return 'Reflection ready. Save when it feels right.'
    }

    if (audioBlob) {
      return 'Processing complete. Review your reflection below.'
    }

    return 'Press record and speak naturally for 30-120 seconds.'
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

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-8">
        <section className="fade-up rounded-[2rem] border border-border/70 bg-white/70 px-6 py-10 shadow-sm backdrop-blur sm:px-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-7 text-center">
            <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
              Capture a thought, hear it back clearly.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Echo Notes listens first, then reflects what matters so your thinking feels lighter.
            </p>

            <RecordButton
              isRecording={isRecording}
              disabled={!canRecord || isBusy}
              onClick={handleRecordClick}
            />

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-foreground/85 shadow-sm">
                {(isRecording || isBusy) && (
                  <FiLoader className="h-4 w-4 animate-spin text-emerald-700" />
                )}
                {statusLabel}
              </span>
              <span className="rounded-full border border-border/70 bg-white/80 px-4 py-2 font-medium tabular-nums text-foreground/85 shadow-sm">
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
              <div className="w-full rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm">
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
                  <FiSave className="h-4 w-4" />
                  Save note
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRerecord}
                  disabled={isBusy}
                  className="h-11"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Re-record
                </Button>
                <Button
                  variant="ghost"
                  onClick={resetSession}
                  disabled={isBusy}
                  className="h-11"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Discard
                </Button>
              </div>
            )}
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
