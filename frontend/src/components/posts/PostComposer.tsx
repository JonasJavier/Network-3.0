import { ImagePlus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useCreatePost } from '../../hooks/usePosts'
import { apiErrorMessage } from '../../lib/api'
import { useAuthStore } from '../../stores/auth'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'

const MAX_LENGTH = 2000

export function PostComposer() {
  const user = useAuthStore((state) => state.user)
  const createPost = useCreatePost()
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  if (!user) return null

  const pickImage = (file: File | null) => {
    setImage(file)
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old)
      return file ? URL.createObjectURL(file) : null
    })
  }

  const submit = () => {
    setError(null)
    createPost.mutate(
      { content: content.trim(), image },
      {
        onSuccess: () => {
          setContent('')
          pickImage(null)
        },
        onError: (err) => setError(apiErrorMessage(err)),
      },
    )
  }

  const canPost = (content.trim().length > 0 || image) && content.length <= MAX_LENGTH

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Avatar user={user} size="md" />
        <div className="min-w-0 flex-1">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Share something with your network…"
            rows={content ? 4 : 2}
            maxLength={MAX_LENGTH + 100}
            className="w-full resize-none border-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          {preview && (
            <div className="relative mt-2 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <img src={preview} alt="Preview" className="max-h-80 w-full object-cover" />
              <button
                onClick={() => pickImage(null)}
                aria-label="Remove image"
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <button
              onClick={() => fileInput.current?.click()}
              aria-label="Add image"
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950"
            >
              <ImagePlus className="size-4.5" />
              Photo
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => pickImage(event.target.files?.[0] ?? null)}
            />
            <div className="flex items-center gap-3">
              {content.length > MAX_LENGTH - 200 && (
                <span
                  className={
                    content.length > MAX_LENGTH
                      ? 'text-xs font-semibold text-red-500'
                      : 'text-xs text-zinc-400'
                  }
                >
                  {MAX_LENGTH - content.length}
                </span>
              )}
              <Button onClick={submit} disabled={!canPost} loading={createPost.isPending}>
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
