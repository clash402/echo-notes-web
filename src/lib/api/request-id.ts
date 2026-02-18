const makeIdSuffix = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const createRequestId = (action: string): string => {
  return `echo-notes-${action}-${makeIdSuffix()}`
}
