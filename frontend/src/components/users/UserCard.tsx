import { Link } from 'react-router'
import type { UserCard as UserCardType } from '../../lib/types'
import { Avatar } from '../ui/Avatar'
import { FollowButton } from './FollowButton'

export function UserCard({ user }: { user: UserCardType }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Link to={`/profile/${user.username}`}>
        <Avatar user={user} size="md" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to={`/profile/${user.username}`}
          className="block truncate text-sm font-semibold hover:underline"
        >
          {user.name}
        </Link>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {user.headline || `@${user.username}`}
        </p>
      </div>
      <FollowButton username={user.username} isFollowing={user.is_following} compact />
    </div>
  )
}
