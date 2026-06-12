import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDetail } from '../lib/types'

interface AuthState {
  access: string | null
  refresh: string | null
  user: UserDetail | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: UserDetail | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      user: null,
      setTokens: (access, refresh) => set({ access, refresh }),
      setUser: (user) => set({ user }),
      logout: () => set({ access: null, refresh: null, user: null }),
    }),
    { name: 'network-auth' },
  ),
)

export const isAuthenticated = () => useAuthStore.getState().access !== null
