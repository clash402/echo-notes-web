import { FiMic, FiSquare } from 'react-icons/fi'
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
        'group relative grid h-44 w-44 place-items-center rounded-full border border-white/40 text-white shadow-[0_20px_70px_-25px_rgba(17,94,89,0.75)] transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/70 disabled:cursor-not-allowed disabled:opacity-55 sm:h-56 sm:w-56',
        isRecording
          ? 'bg-rose-500 hover:bg-rose-600'
          : 'bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700'
      )}
    >
      <span className="absolute inset-0 rounded-full bg-white/20 blur-2xl transition group-hover:opacity-90" />
      <span className="relative z-10 flex flex-col items-center gap-2 text-center">
        {isRecording ? (
          <FiSquare className="h-9 w-9" />
        ) : (
          <FiMic className="h-10 w-10" />
        )}
        <span className="text-sm font-semibold tracking-[0.08em]">
          {isRecording ? 'STOP' : 'RECORD'}
        </span>
      </span>
    </button>
  )
}
