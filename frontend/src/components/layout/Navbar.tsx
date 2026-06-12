import { Bell, Home, LogOut, Moon, Search, Sun, User } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useLogout } from '../../hooks/useAuth'
import { useUnreadCount } from '../../hooks/useNotifications'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth'
import { useThemeStore } from '../../stores/theme'
import { Avatar } from '../ui/Avatar'
import { Logo } from './Logo'

function NavIcon({
  to,
  label,
  children,
}: {
  to: string
  label: string
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      className={({ isActive }) =>
        cn(
          'relative rounded-full p-2.5 transition',
          isActive
            ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300'
            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
        )
      }
    >
      {children}
    </NavLink>
  )
}

export function Navbar() {
  const user = useAuthStore((state) => state.user)
  const { theme, toggle } = useThemeStore()
  const { data: unread = 0 } = useUnreadCount()
  const logout = useLogout()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const onSearch = (event: FormEvent) => {
    event.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Logo />

        <form onSubmit={onSearch} className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people…"
              className="input-base rounded-full pl-10"
            />
          </div>
        </form>

        <nav className="ml-auto flex items-center gap-1.5">
          <NavIcon to="/" label="Home">
            <Home className="size-5" />
          </NavIcon>
          <NavIcon to="/notifications" label="Notifications">
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </NavIcon>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-full p-2.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>

          {user && (
            <div className="relative ml-1" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Account menu"
                className="rounded-full ring-brand-500 transition hover:ring-2"
              >
                <Avatar user={user} size="sm" />
              </button>
              {menuOpen && (
                <div className="card absolute right-0 mt-2 w-56 overflow-hidden p-1.5">
                  <Link
                    to={`/profile/${user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <User className="size-4 text-zinc-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-zinc-500">@{user.username}</p>
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <LogOut className="size-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
