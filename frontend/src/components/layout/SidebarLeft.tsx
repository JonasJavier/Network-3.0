import { Bookmark, Users } from 'lucide-react'
import { Link } from 'react-router'
import { useAuthStore } from '../../stores/auth'
import { Avatar } from '../ui/Avatar'

export function SidebarLeft() {
  const user = useAuthStore((state) => state.user)
  if (!user) return null

  return (
    <aside className="sticky top-20 hidden h-fit lg:block">
      <div className="card overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-brand-600 via-brand-500 to-purple-500">
          {user.cover && (
            <img src={user.cover} alt="" className="size-full object-cover" />
          )}
        </div>
        <div className="-mt-8 px-4 pb-4 text-center">
          <Link to={`/profile/${user.username}`} className="inline-block">
            <Avatar
              user={user}
              size="lg"
              className="ring-4 ring-white dark:ring-zinc-900"
            />
          </Link>
          <Link
            to={`/profile/${user.username}`}
            className="mt-2 block text-base font-bold hover:underline"
          >
            {user.name}
          </Link>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {user.headline || `@${user.username}`}
          </p>

          <div className="mt-4 grid grid-cols-3 divide-x divide-zinc-200 border-t border-zinc-200 pt-3 text-center dark:divide-zinc-800 dark:border-zinc-800">
            <div>
              <p className="text-sm font-bold">{user.posts_count}</p>
              <p className="text-[11px] text-zinc-500">Posts</p>
            </div>
            <div>
              <p className="text-sm font-bold">{user.followers_count}</p>
              <p className="text-[11px] text-zinc-500">Followers</p>
            </div>
            <div>
              <p className="text-sm font-bold">{user.following_count}</p>
              <p className="text-[11px] text-zinc-500">Following</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4 p-2">
        <Link
          to="/?feed=following"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Users className="size-4 text-brand-600 dark:text-brand-400" />
          Following feed
        </Link>
        <Link
          to={`/profile/${user.username}`}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Bookmark className="size-4 text-brand-600 dark:text-brand-400" />
          My posts
        </Link>
      </div>
    </aside>
  )
}
