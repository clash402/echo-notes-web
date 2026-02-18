'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/wav',
] as const

type RecorderStatus =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'stopping'
  | 'ready'
  | 'error'

type StopResolver = (value: Blob | null) => void

export type UseAudioRecorderOptions = {
  preferredMimeTypes?: readonly string[]
  onError?: (message: string) => void
}

export type UseAudioRecorderResult = {
  status: RecorderStatus
  error: string | null
  audioBlob: Blob | null
  audioUrl: string | null
  durationMs: number
  mimeType: string | null
  isRecording: boolean
  canRecord: boolean
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  resetRecording: () => void
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Unknown recording error.'
}

const mediaErrorToMessage = (error: unknown): string => {
  if (!(error instanceof DOMException)) {
    return toErrorMessage(error)
  }

  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return 'Microphone access was denied. Enable microphone permissions and try again.'
  }

  if (error.name === 'NotFoundError') {
    return 'No microphone was found on this device.'
  }

  if (error.name === 'NotReadableError') {
    return 'Your microphone is busy or unavailable. Close other audio apps and try again.'
  }

  return toErrorMessage(error)
}

const getSupportedMimeType = (preferredMimeTypes: readonly string[]): string | null => {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
    return null
  }

  return (
    preferredMimeTypes.find((mimeType) => window.MediaRecorder.isTypeSupported(mimeType)) ??
    null
  )
}

const stopStreamTracks = (stream: MediaStream | null): void => {
  if (!stream) {
    return
  }

  stream.getTracks().forEach((track) => {
    track.stop()
  })
}

export const formatDurationMs = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const useAudioRecorder = (
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderResult => {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [durationMs, setDurationMs] = useState(0)
  const [mimeType, setMimeType] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<number | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const stopResolverRef = useRef<StopResolver | null>(null)
  const stopPromiseRef = useRef<Promise<Blob | null> | null>(null)

  const preferredMimeTypes = options.preferredMimeTypes ?? DEFAULT_MIME_TYPES

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resolveStop = useCallback((blob: Blob | null) => {
    if (!stopResolverRef.current) {
      return
    }

    stopResolverRef.current(blob)
    stopResolverRef.current = null
    stopPromiseRef.current = null
  }, [])

  const resetRecording = useCallback(() => {
    clearTimer()

    resolveStop(null)

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }

    mediaRecorderRef.current = null
    stopStreamTracks(mediaStreamRef.current)
    mediaStreamRef.current = null
    chunksRef.current = []
    startedAtRef.current = null
    setStatus('idle')
    setError(null)
    setAudioBlob(null)
    setAudioUrl(null)
    setDurationMs(0)
    setMimeType(null)
  }, [audioUrl, clearTimer, resolveStop])

  const setRecorderError = useCallback(
    (message: string) => {
      setStatus('error')
      setError(message)
      options.onError?.(message)
    },
    [options]
  )

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current

    if (!recorder) {
      return audioBlob
    }

    if (stopPromiseRef.current) {
      return stopPromiseRef.current
    }

    if (recorder.state !== 'recording') {
      return audioBlob
    }

    clearTimer()

    if (startedAtRef.current) {
      setDurationMs(Date.now() - startedAtRef.current)
    }

    setStatus('stopping')

    stopPromiseRef.current = new Promise<Blob | null>((resolve) => {
      stopResolverRef.current = resolve
    })

    recorder.stop()

    return stopPromiseRef.current
  }, [audioBlob, clearTimer])

  const startRecording = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') {
      return
    }

    if (!window.navigator.mediaDevices?.getUserMedia) {
      setRecorderError('This browser does not support microphone capture.')
      return
    }

    if (typeof window.MediaRecorder === 'undefined') {
      setRecorderError('This browser does not support audio recording.')
      return
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      return
    }

    clearTimer()

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }

    setStatus('requesting_permission')
    setError(null)
    setAudioBlob(null)
    setAudioUrl(null)
    setDurationMs(0)

    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true })
      const supportedMimeType = getSupportedMimeType(preferredMimeTypes)

      const recorder = supportedMimeType
        ? new window.MediaRecorder(stream, { mimeType: supportedMimeType })
        : new window.MediaRecorder(stream)

      mediaRecorderRef.current = recorder
      mediaStreamRef.current = stream
      chunksRef.current = []
      startedAtRef.current = Date.now()
      setMimeType(supportedMimeType ?? recorder.mimeType ?? null)

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = (event: Event) => {
        const recorderError = (event as Event & { error?: DOMException }).error
        const message = recorderError ? toErrorMessage(recorderError) : 'Recording failed.'
        setRecorderError(message)
        clearTimer()
        stopStreamTracks(mediaStreamRef.current)
        mediaStreamRef.current = null
        resolveStop(null)
      }

      recorder.onstop = () => {
        clearTimer()
        stopStreamTracks(mediaStreamRef.current)
        mediaStreamRef.current = null

        if (chunksRef.current.length === 0) {
          setStatus('error')
          setError('No audio was captured. Try recording again.')
          resolveStop(null)
          return
        }

        const finalMimeType = recorder.mimeType || supportedMimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: finalMimeType })

        setAudioBlob(blob)
        setAudioUrl((previousUrl) => {
          if (previousUrl) {
            URL.revokeObjectURL(previousUrl)
          }

          return URL.createObjectURL(blob)
        })
        setStatus('ready')
        setError(null)
        resolveStop(blob)
      }

      recorder.start()
      setStatus('recording')

      timerRef.current = window.setInterval(() => {
        if (!startedAtRef.current) {
          return
        }

        setDurationMs(Date.now() - startedAtRef.current)
      }, 200)
    } catch (caughtError) {
      stopStreamTracks(mediaStreamRef.current)
      mediaStreamRef.current = null
      setRecorderError(mediaErrorToMessage(caughtError))
    }
  }, [audioUrl, clearTimer, preferredMimeTypes, resolveStop, setRecorderError])

  useEffect(() => {
    return () => {
      clearTimer()
      stopStreamTracks(mediaStreamRef.current)

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl, clearTimer])

  const canRecord = useMemo(() => status !== 'requesting_permission' && status !== 'stopping', [status])

  return {
    status,
    error,
    audioBlob,
    audioUrl,
    durationMs,
    mimeType,
    isRecording: status === 'recording',
    canRecord,
    startRecording,
    stopRecording,
    resetRecording,
  }
}
