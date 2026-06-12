import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { LogoMark } from '../components/layout/Logo'

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <LogoMark className="size-12" />
      <h1 className="text-3xl font-extrabold">404 — Page not found</h1>
      <p className="max-w-sm text-zinc-500 dark:text-zinc-400">
        The page you're looking for doesn't exist or was moved.
      </p>
      <Link
        to="/"
        className="mt-2 flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        <Compass className="size-4" />
        Back to the feed
      </Link>
    </div>
  )
}
