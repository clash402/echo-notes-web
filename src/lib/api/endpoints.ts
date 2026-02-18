import { z } from 'zod'
import { createAudioFile } from '@/lib/utils/audio'
import { sortNewestFirst } from '@/lib/utils/time'
import { requestGhostData } from './client'
import {
  echoDataSchema,
  normalizeNoteDetail,
  normalizeNoteSummary,
  noteDetailApiSchema,
  noteSummaryApiSchema,
  saveNoteDataSchema,
  transcriptionDataSchema,
  type EchoData,
  type NoteDetail,
  type NoteSummary,
  type Reflection,
  type SaveNoteData,
  type TranscriptionData,
} from './types'

type TranscribeAudioInput = {
  audioBlob: Blob
  requestId: string
}

type EchoInput = {
  transcript: string
  requestId: string
}

type SaveNoteInput = {
  transcript: string
  reflection: Reflection
  audioUrl?: string
  requestId: string
}

export const transcribeAudio = async ({
  audioBlob,
  requestId,
}: TranscribeAudioInput): Promise<TranscriptionData> => {
  const formData = new FormData()
  formData.append('audio', createAudioFile(audioBlob))

  const response = await requestGhostData({
    path: '/audio/transcribe',
    method: 'POST',
    body: formData,
    requestId,
    dataSchema: transcriptionDataSchema,
  })

  return response.data
}

export const createEchoReflection = async ({
  transcript,
  requestId,
}: EchoInput): Promise<EchoData> => {
  const response = await requestGhostData({
    path: '/echo',
    method: 'POST',
    body: JSON.stringify({ transcript }),
    requestId,
    dataSchema: echoDataSchema,
  })

  return response.data
}

export const saveNote = async ({
  transcript,
  reflection,
  audioUrl,
  requestId,
}: SaveNoteInput): Promise<SaveNoteData> => {
  const response = await requestGhostData({
    path: '/notes',
    method: 'POST',
    body: JSON.stringify({
      transcript,
      reflection,
      audio_url: audioUrl,
    }),
    requestId,
    dataSchema: saveNoteDataSchema,
  })

  return response.data
}

export const getNotes = async (requestId: string): Promise<NoteSummary[]> => {
  const response = await requestGhostData({
    path: '/notes',
    method: 'GET',
    requestId,
    dataSchema: z.array(noteSummaryApiSchema),
  })

  return sortNewestFirst(response.data.map((note) => normalizeNoteSummary(note)))
}

export const getNoteById = async (
  noteId: string,
  requestId: string
): Promise<NoteDetail> => {
  const response = await requestGhostData({
    path: `/notes/${noteId}`,
    method: 'GET',
    requestId,
    dataSchema: noteDetailApiSchema,
  })

  return normalizeNoteDetail(response.data)
}
