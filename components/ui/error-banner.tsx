import { FiAlertCircle } from 'react-icons/fi'
import { cn } from '@/lib/utils'

type ErrorBannerProps = {
  message: string
  requestId?: string
  className?: string
}

export function ErrorBanner({
  message,
  requestId,
  className,
}: ErrorBannerProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900',
        className
      )}
      role="alert"
    >
      <p className="flex items-start gap-2 font-medium">
        <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </p>
      {requestId && (
        <p className="mt-1 text-xs text-red-800/80">Request ID: {requestId}</p>
      )}
    </div>
  )
}
