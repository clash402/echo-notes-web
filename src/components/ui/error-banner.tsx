import { AlertCircle } from 'lucide-react'
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
        'rounded-xl border border-status-danger/25 bg-status-danger/5 px-4 py-3 text-sm text-status-danger',
        className
      )}
      role="alert"
    >
      <p className="flex items-start gap-2 font-medium">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span>{message}</span>
      </p>
      {requestId && (
        <p className="mt-1 font-mono text-xs text-status-danger/80">Request ID: {requestId}</p>
      )}
    </div>
  )
}
