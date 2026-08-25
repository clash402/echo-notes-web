type AudioPlayerProps = {
  src: string
}

export function AudioPlayer({ src }: AudioPlayerProps) {
  return (
    <audio
      controls
      preload="metadata"
      className="w-full rounded-xl border border-border bg-secondary p-2"
    >
      <source src={src} />
      Your browser does not support audio playback.
    </audio>
  )
}
