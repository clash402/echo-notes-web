export const formatTimelineDate = (value: string): string => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export const sortNewestFirst = <T extends { createdAt: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const left = new Date(a.createdAt).getTime()
    const right = new Date(b.createdAt).getTime()

    return right - left
  })
}
