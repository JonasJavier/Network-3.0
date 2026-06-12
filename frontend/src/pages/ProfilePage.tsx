import {
  CalendarDays,
  Globe,
  ImageIcon,
  MapPin,
  Pencil,
  UserX,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { PostFeed } from '../components/posts/PostFeed'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { PageSpinner, Spinner } from '../components/ui/Spinner'
import { EditProfileModal } from '../components/users/EditProfileModal'
import { FollowButton } from '../components/users/FollowButton'
import { UserCard } from '../components/users/UserCard'
import { usePostsFeed } from '../hooks/usePosts'
import { useProfile, useRelationList } from '../hooks/useUsers'
import { cn, formatMonthYear } from '../lib/utils'
import { useAuthStore } from '../stores/auth'

function RelationModal({
  username,
  relation,
  onClose,
}: {
  username: string
  relation: 'followers' | 'following'
  onClose: () => void
}) {
  const list = useRelationList(username, relation)
  const users = list.data?.pages.flatMap((page) => page.results) ?? []

  return (
    <Modal open onClose={onClose} title={relation === 'followers' ? 'Followers' : 'Following'}>
      {list.isLoading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
      {!list.isLoading && users.length === 0 && (
        <p className="py-6 text-center text-sm text-zinc-500">Nobody here yet.</p>
      )}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
      {list.hasNextPage && (
        <button
          onClick={() => list.fetchNextPage()}
          className="mt-3 w-full text-center text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Load more
        </button>
      )}
    </Modal>
  )
}

function MediaGrid({ username }: { username: string }) {
  const feed = usePostsFeed({ author: username })
  const posts = (feed.data?.pages.flatMap((page) => page.results) ?? []).filter(
    (post) => post.image,
  )

  if (feed.isLoading) return <PageSpinner />
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="No media yet"
        description="Photos shared in posts will show up here."
      />
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          to={`/post/${post.id}`}
          className="group relative aspect-square overflow-hidden rounded-xl"
        >
          <img
            src={post.image!}
            alt=""
            loading="lazy"
            className="size-full object-cover transition group-hover:scale-105"
          />
        </Link>
      ))}
      {feed.hasNextPage && (
        <button
          onClick={() => feed.fetchNextPage()}
          className="aspect-square rounded-xl border border-dashed border-zinc-300 text-sm font-semibold text-zinc-500 transition hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700"
        >
          Load more
        </button>
      )}
    </div>
  )
}

export function ProfilePage() {
  const { username = '' } = useParams()
  const me = useAuthStore((state) => state.user)
  const profile = useProfile(username)
  const [tab, setTab] = useState<'posts' | 'media'>('posts')
  const [editing, setEditing] = useState(false)
  const [relation, setRelation] = useState<'followers' | 'following' | null>(null)

  if (profile.isLoading) return <PageSpinner />
  if (profile.isError || !profile.data) {
    return (
      <EmptyState
        icon={UserX}
        title="Profile not found"
        description={`There is no user named @${username}.`}
      />
    )
  }

  const user = profile.data
  const isMe = me?.username === user.username

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-brand-600 via-brand-500 to-purple-500 sm:h-52">
          {user.cover && <img src={user.cover} alt="" className="size-full object-cover" />}
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-end justify-between">
            <Avatar
              user={user}
              size="xl"
              className="-mt-14 ring-4 ring-white dark:ring-zinc-900"
            />
            <div className="pt-3">
              {isMe ? (
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil className="size-4" />
                  Edit profile
                </Button>
              ) : (
                <FollowButton username={user.username} isFollowing={user.is_following} />
              )}
            </div>
          </div>

          <h1 className="mt-3 text-xl font-extrabold">{user.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">@{user.username}</p>
          {user.headline && <p className="mt-1.5 text-[15px] font-medium">{user.headline}</p>}
          {user.bio && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {user.bio}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {user.location}
              </span>
            )}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400"
              >
                <Globe className="size-4" />
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="size-4" />
              Joined {formatMonthYear(user.date_joined)}
            </span>
          </div>

          <div className="mt-4 flex gap-5 text-sm">
            <span>
              <strong>{user.posts_count}</strong>{' '}
              <span className="text-zinc-500">Posts</span>
            </span>
            <button onClick={() => setRelation('followers')} className="hover:underline">
              <strong>{user.followers_count}</strong>{' '}
              <span className="text-zinc-500">Followers</span>
            </button>
            <button onClick={() => setRelation('following')} className="hover:underline">
              <strong>{user.following_count}</strong>{' '}
              <span className="text-zinc-500">Following</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card flex p-1.5">
        {(
          [
            { key: 'posts', label: 'Posts' },
            { key: 'media', label: 'Media' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm font-semibold transition',
              tab === key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'posts' ? (
        <PostFeed
          key={user.username}
          filters={{ author: user.username }}
          emptyTitle={isMe ? "You haven't posted yet" : `${user.name} hasn't posted yet`}
          emptyDescription={isMe ? 'Share your first update with your network.' : undefined}
        />
      ) : (
        <MediaGrid username={user.username} />
      )}

      {isMe && editing && (
        <EditProfileModal user={user} open={editing} onClose={() => setEditing(false)} />
      )}
      {relation && (
        <RelationModal
          username={user.username}
          relation={relation}
          onClose={() => setRelation(null)}
        />
      )}
    </div>
  )
}
