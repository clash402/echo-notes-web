export const queryKeys = {
  notes: ['notes'] as const,
  note: (noteId: string) => ['notes', noteId] as const,
}
