import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggle: () => void
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        apply(next)
        set({ theme: next })
      },
    }),
    {
      name: 'network-theme',
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return
        apply(state.theme)
      },
    },
  ),
)

// First visit: respect the OS preference.
if (!localStorage.getItem('network-theme')) {
  const initial = systemTheme()
  useThemeStore.setState({ theme: initial })
  apply(initial)
}
