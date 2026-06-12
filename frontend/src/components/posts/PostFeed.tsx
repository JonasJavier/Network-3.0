import { FileQuestion } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { usePostsFeed, type FeedFilters } from '../../hooks/usePosts'
import { EmptyState } from '../ui/EmptyState'
import { FeedSkeleton } from '../ui/PostSkeleton'
import { Spinner } from '../ui/Spinner'
import { PostCard } from './PostCard'

interface PostFeedProps {
  filters?: FeedFilters
  emptyTitle?: string
  emptyDescription?: string
}

export function PostFeed({
  filters = {},
  emptyTitle = 'No posts yet',
  emptyDescription = 'Be the first to share something.',
}: PostFeedProps) {
  const feed = usePostsFeed(filters)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) {
          feed.fetchNextPage()
        }
      },
      { rootMargin: '600px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [feed])

  if (feed.isLoading) return <FeedSkeleton />

  if (feed.isError) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Couldn't load the feed"
        description="Check that the API is running and try again."
      />
    )
  }

  const posts = feed.data?.pages.flatMap((page) => page.results) ?? []

  if (posts.length === 0) {
    return (
      <EmptyState icon={FileQuestion} title={emptyTitle} description={emptyDescription} />
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={sentinel} />
      {feed.isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}
    </div>
  )
}
