import { SearchX, Search as SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PostFeed } from '../components/posts/PostFeed'
import { EmptyState } from '../components/ui/EmptyState'
import { PageSpinner } from '../components/ui/Spinner'
import { UserCard } from '../components/users/UserCard'
import { useSearchUsers } from '../hooks/useUsers'
import { cn } from '../lib/utils'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [input, setInput] = useState(query)
  const [tab, setTab] = useState<'people' | 'posts'>('people')
  const users = useSearchUsers(query)

  // Sync the input when the URL query changes (e.g. via the navbar search).
  const [prevQuery, setPrevQuery] = useState(query)
  if (prevQuery !== query) {
    setPrevQuery(query)
    setInput(query)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (input.trim()) setParams({ q: input.trim() })
  }

  const found = users.data?.pages.flatMap((page) => page.results) ?? []

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-400" />
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search people or posts…"
          autoFocus
          className="input-base rounded-full py-3 pl-12 text-base"
        />
      </form>

      {query && (
        <div className="card flex p-1.5">
          {(
            [
              { key: 'people', label: 'People' },
              { key: 'posts', label: 'Posts' },
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
      )}

      {!query && (
        <EmptyState
          icon={SearchIcon}
          title="Search the network"
          description="Find people by name, username or headline — or search posts by content."
        />
      )}

      {query && tab === 'people' && (
        <>
          {users.isLoading && <PageSpinner />}
          {!users.isLoading && found.length === 0 && (
            <EmptyState
              icon={SearchX}
              title={`No people matching “${query}”`}
              description="Try a different name or username."
            />
          )}
          {found.length > 0 && (
            <div className="card divide-y divide-zinc-100 px-4 dark:divide-zinc-800">
              {found.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
          {users.hasNextPage && (
            <button
              onClick={() => users.fetchNextPage()}
              className="w-full text-center text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Load more
            </button>
          )}
        </>
      )}

      {query && tab === 'posts' && (
        <PostFeed
          key={query}
          filters={{ search: query }}
          emptyTitle={`No posts matching “${query}”`}
          emptyDescription="Try different keywords."
        />
      )}
    </div>
  )
}
