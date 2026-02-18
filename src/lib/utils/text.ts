export const truncateText = (value: string, maxLength = 140): string => {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trimEnd()}...`
}

export const toSingleLine = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim()
}
