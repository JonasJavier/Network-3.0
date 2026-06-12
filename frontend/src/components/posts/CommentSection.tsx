import { SendHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useAddComment, useComments } from '../../hooks/useComments'
import { useAuthStore } from '../../stores/auth'
import { Avatar } from '../ui/Avatar'
import { Spinner } from '../ui/Spinner'
import { CommentItem } from './CommentItem'

export function CommentSection({ postId }: { postId: number }) {
  const me = useAuthStore((state) => state.user)
  const comments = useComments(postId)
  const addComment = useAddComment(postId)
  const [draft, setDraft] = useState('')

  const submit = () => {
    const content = draft.trim()
    if (!content) return
    addComment.mutate({ content }, { onSuccess: () => setDraft('') })
  }

  const allComments = comments.data?.pages.flatMap((page) => page.results) ?? []

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
      {me && (
        <div className="flex items-center gap-2.5">
          <Avatar user={me} size="sm" />
          <div className="relative flex-1">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submit()
                }
              }}
              placeholder="Write a comment…"
              className="input-base rounded-full pr-11"
            />
            <button
              onClick={submit}
              disabled={!draft.trim() || addComment.isPending}
              aria-label="Send comment"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-brand-600 transition hover:bg-brand-50 disabled:opacity-40 dark:text-brand-400 dark:hover:bg-brand-950"
            >
              <SendHorizontal className="size-4.5" />
            </button>
          </div>
        </div>
      )}

      {comments.isLoading && (
        <div className="flex justify-center py-4">
          <Spinner className="size-5 text-brand-600" />
        </div>
      )}

      <div className="mt-1 space-y-1">
        {allComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={postId} />
        ))}
      </div>

      {comments.hasNextPage && (
        <button
          onClick={() => comments.fetchNextPage()}
          disabled={comments.isFetchingNextPage}
          className="mt-2 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          {comments.isFetchingNextPage ? 'Loading…' : 'Show more comments'}
        </button>
      )}
    </div>
  )
}
