import { z } from 'zod'

export const ghostMetaSchema = z
  .object({
    request_id: z.string().optional(),
  })
  .passthrough()

export const createGhostEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    data: dataSchema,
    meta: ghostMetaSchema.optional().default({}),
  })
}

const noteIdSchema = z.union([z.string(), z.number()]).transform((value) => String(value))

const nonEmptyStringSchema = z.string().trim().min(1)

export const confidenceSchema = z.enum(['high', 'medium', 'low'])

export const reflectionSchema = z.object({
  summary: z.string(),
  themes: z.array(z.string()),
  questions: z.array(z.string()),
  next_thoughts: z.array(z.string()),
})

export const transcriptionDataSchema = z.object({
  transcript: z.string(),
  language: z.string(),
  duration_s: z.number(),
})

export const echoDataSchema = z.object({
  title: z.string(),
  reflection: reflectionSchema,
  confidence: confidenceSchema,
})

export const saveNoteDataSchema = z.object({
  id: noteIdSchema,
  created_at: z.string(),
})

export const noteSummaryApiSchema = z
  .object({
    id: noteIdSchema,
    title: nonEmptyStringSchema.optional(),
    created_at: z.string(),
    summary: z.string().optional(),
    reflection_summary: z.string().optional(),
    reflection: reflectionSchema.partial().optional(),
  })
  .passthrough()

export const noteDetailApiSchema = z
  .object({
    id: noteIdSchema,
    title: nonEmptyStringSchema.optional(),
    created_at: z.string(),
    transcript: z.string().optional(),
    audio_url: z.string().optional(),
    reflection: reflectionSchema.partial().optional(),
    confidence: confidenceSchema.optional(),
    concepts: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    linked_notes: z.array(z.unknown()).optional(),
  })
  .passthrough()

export type GhostMeta = z.infer<typeof ghostMetaSchema>
export type Reflection = z.infer<typeof reflectionSchema>
export type TranscriptionData = z.infer<typeof transcriptionDataSchema>
export type EchoData = z.infer<typeof echoDataSchema>
export type SaveNoteData = z.infer<typeof saveNoteDataSchema>
export type NoteSummaryApi = z.infer<typeof noteSummaryApiSchema>
export type NoteDetailApi = z.infer<typeof noteDetailApiSchema>

export type LinkedNote = {
  id: string
  title: string
}

export type NoteSummary = {
  id: string
  title: string
  reflectionSummary: string
  createdAt: string
}

export type NoteDetail = {
  id: string
  title: string
  transcript: string
  reflection: Reflection
  confidence?: z.infer<typeof confidenceSchema>
  audioUrl?: string
  createdAt: string
  concepts: string[]
  tags: string[]
  linkedNotes: LinkedNote[]
}

const defaultReflection: Reflection = {
  summary: '',
  themes: [],
  questions: [],
  next_thoughts: [],
}

const normalizeReflection = (
  reflection: Partial<Reflection> | undefined
): Reflection => {
  if (!reflection) {
    return defaultReflection
  }

  return {
    summary: reflection.summary ?? '',
    themes: reflection.themes ?? [],
    questions: reflection.questions ?? [],
    next_thoughts: reflection.next_thoughts ?? [],
  }
}

const normalizeLinkedNote = (value: unknown): LinkedNote | null => {
  if (typeof value === 'string' || typeof value === 'number') {
    const id = String(value)

    return {
      id,
      title: `Note ${id}`,
    }
  }

  if (!value || typeof value !== 'object' || !('id' in value)) {
    return null
  }

  const record = value as {
    id: string | number
    title?: string
  }

  return {
    id: String(record.id),
    title: record.title?.trim() || `Note ${String(record.id)}`,
  }
}

export const normalizeNoteSummary = (note: NoteSummaryApi): NoteSummary => {
  const reflectionSummary =
    note.reflection_summary ?? note.summary ?? note.reflection?.summary ?? ''

  return {
    id: note.id,
    title: note.title ?? 'Untitled note',
    reflectionSummary,
    createdAt: note.created_at,
  }
}

export const normalizeNoteDetail = (note: NoteDetailApi): NoteDetail => {
  const linkedNotes = (note.linked_notes ?? [])
    .map((linkedNote) => normalizeLinkedNote(linkedNote))
    .filter((linkedNote): linkedNote is LinkedNote => linkedNote !== null)

  return {
    id: note.id,
    title: note.title ?? 'Untitled note',
    transcript: note.transcript ?? '',
    reflection: normalizeReflection(note.reflection),
    confidence: note.confidence,
    audioUrl: note.audio_url,
    createdAt: note.created_at,
    concepts: note.concepts ?? [],
    tags: note.tags ?? [],
    linkedNotes,
  }
}
