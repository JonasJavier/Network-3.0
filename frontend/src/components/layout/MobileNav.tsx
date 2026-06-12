import { Bell, Home, Search, User } from 'lucide-react'
import { NavLink } from 'react-router'
import { useUnreadCount } from '../../hooks/useNotifications'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth'

export function MobileNav() {
  const user = useAuthStore((state) => state.user)
  const { data: unread = 0 } = useUnreadCount()

  const items = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unread },
    { to: `/profile/${user?.username ?? ''}`, label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/90 backdrop-blur-lg md:hidden dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex h-14 items-center justify-around">
        {items.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'relative rounded-full p-2.5 transition',
                isActive
                  ? 'text-brand-600 dark:text-brand-300'
                  : 'text-zinc-500 dark:text-zinc-400',
              )
            }
          >
            <Icon className="size-6" />
            {badge !== undefined && badge > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
