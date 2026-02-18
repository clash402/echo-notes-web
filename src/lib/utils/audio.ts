const AUDIO_EXTENSION_MAP: Record<string, string> = {
  'audio/webm;codecs=opus': 'webm',
  'audio/webm': 'webm',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
}

export const getAudioFileExtension = (mimeType: string): string => {
  return AUDIO_EXTENSION_MAP[mimeType] ?? 'webm'
}

export const createAudioFile = (blob: Blob, fileNamePrefix = 'echo-note'): File => {
  const mimeType = blob.type || 'audio/webm'
  const extension = getAudioFileExtension(mimeType)

  return new File([blob], `${fileNamePrefix}.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  })
}
