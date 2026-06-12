import {
  Heart,
  Link as LinkIcon,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useDeletePost, useLikePost, useUpdatePost } from '../../hooks/usePosts'
import type { Post } from '../../lib/types'
import { cn, timeAgo } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { CommentSection } from './CommentSection'

interface PostCardProps {
  post: Post
  defaultShowComments?: boolean
}

export function PostCard({ post, defaultShowComments = false }: PostCardProps) {
  const me = useAuthStore((state) => state.user)
  const likePost = useLikePost()
  const deletePost = useDeletePost()
  const updatePost = useUpdatePost(post.id)

  const [showComments, setShowComments] = useState(defaultShowComments)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.content)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isMine = me?.id === post.author.id

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const saveEdit = () => {
    updatePost.mutate(
      { content: draft.trim() },
      { onSuccess: () => setEditing(false) },
    )
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <article className="card p-4">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.author.username}`}>
          <Avatar user={post.author} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${post.author.username}`}
            className="block truncate text-sm font-bold hover:underline"
          >
            {post.author.name}
          </Link>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {post.author.headline || `@${post.author.username}`}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            <Link to={`/post/${post.id}`} className="hover:underline">
              {timeAgo(post.created_at)}
            </Link>
            {post.is_edited && ' · edited'}
          </p>
        </div>

        {isMine && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Post options"
              className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <MoreHorizontal className="size-5" />
            </button>
            {menuOpen && (
              <div className="card absolute right-0 z-10 mt-1 w-40 p-1.5">
                <button
                  onClick={() => {
                    setEditing(true)
                    setDraft(post.content)
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Pencil className="size-4" />
                  Edit
                </button>
                <button
                  onClick={() => deletePost.mutate(post.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="size-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            className="input-base resize-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={!draft.trim()}
              loading={updatePost.isPending}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        post.content && (
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">
            {post.content}
          </p>
        )
      )}

      {post.image && (
        <Link to={`/post/${post.id}`} className="mt-3 block overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <img
            src={post.image}
            alt=""
            loading="lazy"
            className="max-h-[28rem] w-full object-cover transition hover:scale-[1.01]"
          />
        </Link>
      )}

      <div className="mt-3 flex items-center gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <button
          onClick={() => likePost.mutate(post.id)}
          aria-pressed={post.is_liked}
          className={cn(
            'group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition',
            post.is_liked
              ? 'text-red-600 dark:text-red-400'
              : 'text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400',
          )}
        >
          <Heart
            className={cn(
              'size-4.5 transition group-active:scale-125',
              post.is_liked && 'fill-current',
            )}
          />
          {post.likes_count > 0 && post.likes_count}
          <span className="sr-only">likes</span>
        </button>

        <button
          onClick={() => setShowComments((show) => !show)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-brand-50 hover:text-brand-600 dark:text-zinc-400 dark:hover:bg-brand-950 dark:hover:text-brand-400"
        >
          <MessageCircle className="size-4.5" />
          {post.comments_count > 0 && post.comments_count}
          <span className="sr-only">comments</span>
        </button>

        <button
          onClick={copyLink}
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <LinkIcon className="size-4" />
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </article>
  )
}
