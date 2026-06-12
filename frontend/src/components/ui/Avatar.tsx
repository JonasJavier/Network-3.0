import { cn, gradientFor, initials } from '../../lib/utils'
import type { UserMini } from '../../lib/types'

const SIZES = {
  xs: 'size-7 text-[10px]',
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-28 text-3xl',
} as const

interface AvatarProps {
  user: Pick<UserMini, 'username' | 'name' | 'avatar'>
  size?: keyof typeof SIZES
  className?: string
}

export function Avatar({ user, size = 'md', className }: AvatarProps) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={cn(
          'shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700',
          SIZES[size],
          className,
        )}
      />
    )
  }
  return (
    <div
      aria-label={user.name}
      className={cn(
        'flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white',
        gradientFor(user.username),
        SIZES[size],
        className,
      )}
    >
      {initials(user.name)}
    </div>
  )
}
