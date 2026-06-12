import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin', className ?? 'size-6 text-brand-600')} />
}

export function PageSpinner() {
  return (
    <div className="flex justify-center py-16">
      <Spinner />
    </div>
  )
}
