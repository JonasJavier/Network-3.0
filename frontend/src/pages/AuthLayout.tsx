import { MessageCircle, TrendingUp, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { LogoMark } from '../components/layout/Logo'

const FEATURES = [
  {
    icon: Users,
    title: 'Grow your circle',
    text: 'Follow professionals you admire and build a network that matters.',
  },
  {
    icon: MessageCircle,
    title: 'Join the conversation',
    text: 'Share ideas, comment on posts and exchange feedback in threads.',
  },
  {
    icon: TrendingUp,
    title: 'Stay in the loop',
    text: 'A personalised feed keeps the signal high and the noise low.',
  },
]

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-purple-700 p-12 text-white lg:flex">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 size-[28rem] rounded-full bg-purple-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <LogoMark className="size-10" />
          <span className="text-2xl font-extrabold tracking-tight">Network</span>
        </div>

        <div className="relative max-w-md space-y-8">
          <h1 className="text-4xl font-extrabold leading-tight">
            Where professionals
            <br />
            connect & grow.
          </h1>
          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/75">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/60">
          Network 3.0 — rebuilt with Django REST Framework, React & TypeScript.
        </p>
      </div>

      <div className="flex items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
