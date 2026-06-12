import { Sparkles } from 'lucide-react'
import { useSuggestions } from '../../hooks/useUsers'
import { UserCard } from '../users/UserCard'

export function SidebarRight() {
  const { data: suggestions, isLoading } = useSuggestions()

  return (
    <aside className="sticky top-20 hidden h-fit xl:block">
      <div className="card p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="size-4 text-brand-600 dark:text-brand-400" />
          Who to follow
        </h2>
        {isLoading && (
          <div className="space-y-3 py-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex animate-pulse items-center gap-3">
                <div className="size-11 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-2.5 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        )}
        {suggestions && suggestions.length === 0 && (
          <p className="py-3 text-sm text-zinc-500">
            You're following everyone already. 🎉
          </p>
        )}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {suggestions?.map((user) => <UserCard key={user.id} user={user} />)}
        </div>
      </div>
      <p className="mt-4 px-2 text-xs text-zinc-400 dark:text-zinc-600">
        Network 3.0 — built with Django REST Framework & React
      </p>
    </aside>
  )
}
