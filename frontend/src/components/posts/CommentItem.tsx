import { Heart, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import {
  useAddComment,
  useDeleteComment,
  useLikeComment,
} from '../../hooks/useComments'
import type { Comment } from '../../lib/types'
import { cn, timeAgo } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth'
import { Avatar } from '../ui/Avatar'

interface CommentItemProps {
  comment: Comment
  postId: number
  isReply?: boolean
}

export function CommentItem({ comment, postId, isReply = false }: CommentItemProps) {
  const me = useAuthStore((state) => state.user)
  const likeComment = useLikeComment(postId)
  const deleteComment = useDeleteComment(postId)
  const addComment = useAddComment(postId)
  const [replying, setReplying] = useState(false)
  const [draft, setDraft] = useState('')

  const sendReply = () => {
    const content = draft.trim()
    if (!content) return
    addComment.mutate(
      { content, parent: comment.id },
      {
        onSuccess: () => {
          setDraft('')
          setReplying(false)
        },
      },
    )
  }

  return (
    <div className={cn('flex gap-2.5 py-2', isReply && 'ml-10')}>
      <Link to={`/profile/${comment.author.username}`} className="mt-0.5">
        <Avatar user={comment.author} size={isReply ? 'xs' : 'sm'} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-zinc-100 px-3.5 py-2.5 dark:bg-zinc-800">
          <div className="flex items-baseline gap-2">
            <Link
              to={`/profile/${comment.author.username}`}
              className="truncate text-[13px] font-bold hover:underline"
            >
              {comment.author.name}
            </Link>
            <span className="shrink-0 text-[11px] text-zinc-400">
              {timeAgo(comment.created_at)}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
        </div>

        <div className="mt-1 flex items-center gap-3 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <button
            onClick={() => likeComment.mutate(comment.id)}
            className={cn(
              'flex items-center gap-1 transition hover:text-red-600 dark:hover:text-red-400',
              comment.is_liked && 'text-red-600 dark:text-red-400',
            )}
          >
            <Heart className={cn('size-3.5', comment.is_liked && 'fill-current')} />
            {comment.likes_count > 0 && comment.likes_count}
            <span className="sr-only">like</span>
          </button>
          {!isReply && (
            <button
              onClick={() => setReplying((value) => !value)}
              className="transition hover:text-brand-600 dark:hover:text-brand-400"
            >
              Reply
            </button>
          )}
          {me?.id === comment.author.id && (
            <button
              onClick={() => deleteComment.mutate(comment.id)}
              className="flex items-center gap-1 transition hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="size-3.5" />
              <span className="sr-only">delete</span>
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2 flex gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') sendReply()
                if (event.key === 'Escape') setReplying(false)
              }}
              placeholder={`Reply to ${comment.author.name}…`}
              className="input-base rounded-full py-2 text-sm"
            />
          </div>
        )}

        {comment.replies.map((reply) => (
          <CommentItem key={reply.id} comment={reply} postId={postId} isReply />
        ))}
      </div>
    </div>
  )
}
