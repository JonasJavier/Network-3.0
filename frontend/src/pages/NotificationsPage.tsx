import {
  BellOff,
  CheckCheck,
  Heart,
  MessageCircle,
  Reply,
  UserPlus,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageSpinner, Spinner } from '../components/ui/Spinner'
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from '../hooks/useNotifications'
import type { AppNotification, NotificationVerb } from '../lib/types'
import { cn, timeAgo } from '../lib/utils'

const VERB_META: Record<
  NotificationVerb,
  { icon: typeof Heart; text: string; color: string }
> = {
  follow: { icon: UserPlus, text: 'started following you', color: 'text-brand-600 bg-brand-50 dark:bg-brand-950 dark:text-brand-300' },
  like_post: { icon: Heart, text: 'liked your post', color: 'text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400' },
  comment: { icon: MessageCircle, text: 'commented on your post', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-400' },
  reply: { icon: Reply, text: 'replied to your comment', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50 dark:text-violet-400' },
  like_comment: { icon: Heart, text: 'liked your comment', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400' },
}

function NotificationRow({ notification }: { notification: AppNotification }) {
  const markRead = useMarkRead()
  const navigate = useNavigate()
  const meta = VERB_META[notification.verb]
  const Icon = meta.icon

  const open = () => {
    if (!notification.is_read) markRead.mutate(notification.id)
    if (notification.post) {
      navigate(`/post/${notification.post}`)
    } else {
      navigate(`/profile/${notification.actor.username}`)
    }
  }

  return (
    <button
      onClick={open}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
        !notification.is_read && 'bg-brand-50/60 dark:bg-brand-950/30',
      )}
    >
      <div className="relative">
        <Avatar user={notification.actor} size="md" />
        <span
          className={cn(
            'absolute -bottom-1 -right-1 flex size-5.5 items-center justify-center rounded-full ring-2 ring-white dark:ring-zinc-900',
            meta.color,
          )}
        >
          <Icon className="size-3" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <Link
            to={`/profile/${notification.actor.username}`}
            onClick={(event) => event.stopPropagation()}
            className="font-bold hover:underline"
          >
            {notification.actor.name}
          </Link>{' '}
          {meta.text}
        </p>
        {notification.post_preview && (
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            “{notification.post_preview}”
          </p>
        )}
        <p className="mt-0.5 text-xs text-zinc-400">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.is_read && (
        <span className="mt-2 size-2.5 shrink-0 rounded-full bg-brand-600" />
      )}
    </button>
  )
}

export function NotificationsPage() {
  const notifications = useNotifications()
  const markAllRead = useMarkAllRead()

  if (notifications.isLoading) return <PageSpinner />

  const all = notifications.data?.pages.flatMap((page) => page.results) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Notifications</h1>
        {all.some((notification) => !notification.is_read) && (
          <Button
            variant="ghost"
            onClick={() => markAllRead.mutate()}
            loading={markAllRead.isPending}
          >
            <CheckCheck className="size-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Nothing here yet"
          description="Likes, comments and new followers will show up here."
        />
      ) : (
        <div className="card divide-y divide-zinc-100 overflow-hidden p-0 dark:divide-zinc-800">
          {all.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} />
          ))}
        </div>
      )}

      {notifications.hasNextPage && (
        <div className="flex justify-center">
          {notifications.isFetchingNextPage ? (
            <Spinner />
          ) : (
            <Button variant="secondary" onClick={() => notifications.fetchNextPage()}>
              Load more
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
