import { Camera } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { useUpdateProfile } from '../../hooks/useUsers'
import { apiErrorMessage } from '../../lib/api'
import type { UserDetail } from '../../lib/types'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface EditProfileModalProps {
  user: UserDetail
  open: boolean
  onClose: () => void
}

export function EditProfileModal({ user, open, onClose }: EditProfileModalProps) {
  const updateProfile = useUpdateProfile()
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    headline: user.headline,
    bio: user.bio,
    location: user.location,
    website: user.website,
  })
  const [avatar, setAvatar] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const avatarInput = useRef<HTMLInputElement>(null)
  const coverInput = useRef<HTMLInputElement>(null)

  const field =
    (key: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((value) => ({ ...value, [key]: event.target.value }))

  const submit = () => {
    setError(null)
    updateProfile.mutate(
      { ...form, avatar, cover },
      {
        onSuccess: onClose,
        onError: (err) => setError(apiErrorMessage(err)),
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <div className="relative mb-12">
        <div className="h-32 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-purple-500">
          {(coverPreview ?? user.cover) && (
            <img
              src={coverPreview ?? user.cover ?? ''}
              alt=""
              className="size-full object-cover"
            />
          )}
        </div>
        <button
          onClick={() => coverInput.current?.click()}
          aria-label="Change cover"
          className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
        >
          <Camera className="size-4" />
        </button>
        <input
          ref={coverInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            setCover(file)
            setCoverPreview(file ? URL.createObjectURL(file) : null)
          }}
        />
        <div className="absolute -bottom-10 left-4">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="size-20 rounded-full object-cover ring-4 ring-white dark:ring-zinc-900"
              />
            ) : (
              <Avatar user={user} size="lg" className="size-20 ring-4 ring-white dark:ring-zinc-900" />
            )}
            <button
              onClick={() => avatarInput.current?.click()}
              aria-label="Change avatar"
              className="absolute -bottom-1 -right-1 rounded-full bg-brand-600 p-1.5 text-white transition hover:bg-brand-700"
            >
              <Camera className="size-3.5" />
            </button>
            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setAvatar(file)
                setAvatarPreview(file ? URL.createObjectURL(file) : null)
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.first_name}
            onChange={field('first_name')}
            placeholder="First name"
            className="input-base"
          />
          <input
            value={form.last_name}
            onChange={field('last_name')}
            placeholder="Last name"
            className="input-base"
          />
        </div>
        <input
          value={form.headline}
          onChange={field('headline')}
          placeholder="Headline — e.g. Frontend Engineer @ Acme"
          maxLength={120}
          className="input-base"
        />
        <textarea
          value={form.bio}
          onChange={field('bio')}
          placeholder="About you…"
          rows={3}
          maxLength={500}
          className="input-base resize-none"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={form.location}
            onChange={field('location')}
            placeholder="Location"
            className="input-base"
          />
          <input
            value={form.website}
            onChange={field('website')}
            placeholder="Website (https://…)"
            type="url"
            className="input-base"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={updateProfile.isPending}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
