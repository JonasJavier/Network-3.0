import { UserMinus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useFollow } from '../../hooks/useUsers'
import { useAuthStore } from '../../stores/auth'
import { Button } from '../ui/Button'

interface FollowButtonProps {
  username: string
  isFollowing: boolean
  compact?: boolean
}

export function FollowButton({ username, isFollowing, compact = false }: FollowButtonProps) {
  const me = useAuthStore((state) => state.user)
  const follow = useFollow()
  const [hovering, setHovering] = useState(false)

  if (me?.username === username) return null

  if (isFollowing) {
    return (
      <Button
        variant="secondary"
        loading={follow.isPending}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => follow.mutate({ username, follow: false })}
        className={compact ? 'px-3 py-1.5 text-xs' : ''}
      >
        {!follow.isPending && <UserMinus className="size-4" />}
        {hovering ? 'Unfollow' : 'Following'}
      </Button>
    )
  }

  return (
    <Button
      loading={follow.isPending}
      onClick={() => follow.mutate({ username, follow: true })}
      className={compact ? 'px-3 py-1.5 text-xs' : ''}
    >
      {!follow.isPending && <UserPlus className="size-4" />}
      Follow
    </Button>
  )
}
