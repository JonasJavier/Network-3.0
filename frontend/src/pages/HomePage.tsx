import { useSearchParams } from 'react-router'
import { PostComposer } from '../components/posts/PostComposer'
import { PostFeed } from '../components/posts/PostFeed'
import { cn } from '../lib/utils'

export function HomePage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('feed') === 'following' ? 'following' : 'all'

  return (
    <div className="space-y-4">
      <PostComposer />

      <div className="card flex p-1.5">
        {(
          [
            { key: 'all', label: 'For you' },
            { key: 'following', label: 'Following' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setParams(key === 'all' ? {} : { feed: 'following' })}
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

      {tab === 'following' ? (
        <PostFeed
          key="following"
          filters={{ feed: 'following' }}
          emptyTitle="Your following feed is quiet"
          emptyDescription="Follow people to see their posts here. Check the suggestions panel!"
        />
      ) : (
        <PostFeed key="all" />
      )}
    </div>
  )
}
