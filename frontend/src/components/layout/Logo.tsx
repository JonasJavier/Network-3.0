import { Link } from 'react-router'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className ?? 'size-8'} aria-hidden>
      <rect width="64" height="64" rx="14" className="fill-brand-600" />
      <circle cx="20" cy="22" r="6" fill="#fff" />
      <circle cx="44" cy="18" r="5" fill="#c7d2fe" />
      <circle cx="40" cy="44" r="7" fill="#fff" />
      <path
        d="M20 22 L44 18 M20 22 L40 44 M44 18 L40 44"
        stroke="#a5b4fc"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <LogoMark />
      {withText && (
        <span className="hidden text-xl font-extrabold tracking-tight sm:block">
          Network
        </span>
      )}
    </Link>
  )
}
