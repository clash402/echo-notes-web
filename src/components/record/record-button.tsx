import { Mic, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

type RecordButtonProps = {
  isRecording: boolean
  disabled?: boolean
  onClick: () => void
}

export function RecordButton({
  isRecording,
  disabled,
  onClick,
}: RecordButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      className={cn(
        'group relative grid h-36 w-36 place-items-center rounded-full border-8 border-card text-white shadow-[0_18px_48px_-24px_rgba(13,31,45,0.55)] transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-55 sm:h-40 sm:w-40',
        isRecording
          ? 'bg-status-danger hover:bg-status-danger/90'
          : 'bg-primary hover:bg-primary/90'
      )}
    >
      <span className="relative z-10 flex flex-col items-center gap-2 text-center">
        {isRecording ? (
          <Square className="h-7 w-7" strokeWidth={1.75} />
        ) : (
          <Mic className="h-8 w-8" strokeWidth={1.75} />
        )}
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">
          {isRecording ? 'STOP' : 'RECORD'}
        </span>
      </span>
    </button>
  )
}
