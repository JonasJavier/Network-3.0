export function PostSkeleton() {
  return (
    <div className="card animate-pulse p-4">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-2.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  )
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <PostSkeleton key={index} />
      ))}
    </div>
  )
}
