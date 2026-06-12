import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { PostCard } from '../components/posts/PostCard'
import { EmptyState } from '../components/ui/EmptyState'
import { PageSpinner } from '../components/ui/Spinner'
import { usePost } from '../hooks/usePosts'

export function PostDetailPage() {
  const { id = '' } = useParams()
  const post = usePost(Number(id))

  if (post.isLoading) return <PageSpinner />
  if (post.isError || !post.data) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Post not found"
        description="It may have been deleted by its author."
        action={
          <Link
            to="/"
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Back to the feed
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Link>
      <PostCard post={post.data} defaultShowComments />
    </div>
  )
}
