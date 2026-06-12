import { Outlet } from 'react-router'
import { useMe } from '../../hooks/useAuth'
import { MobileNav } from './MobileNav'
import { Navbar } from './Navbar'
import { SidebarLeft } from './SidebarLeft'
import { SidebarRight } from './SidebarRight'

export function AppLayout() {
  useMe()

  return (
    <div className="min-h-dvh pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <SidebarLeft />
        <div className="min-w-0">
          <Outlet />
        </div>
        <SidebarRight />
      </main>
      <MobileNav />
    </div>
  )
}
