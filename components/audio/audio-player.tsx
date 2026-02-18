type AudioPlayerProps = {
  src: string
}

export function AudioPlayer({ src }: AudioPlayerProps) {
  return (
    <audio
      controls
      preload="metadata"
      className="w-full rounded-2xl border border-border/70 bg-background/70 p-2"
    >
      <source src={src} />
      Your browser does not support audio playback.
    </audio>
  )
}
