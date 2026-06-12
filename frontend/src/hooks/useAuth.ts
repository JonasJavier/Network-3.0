import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { api } from '../lib/api'
import type { UserDetail } from '../lib/types'
import { useAuthStore } from '../stores/auth'

interface LoginInput {
  username: string
  password: string
}

interface RegisterInput extends LoginInput {
  email: string
  first_name?: string
  last_name?: string
}

export function useLogin() {
  const { setTokens, setUser } = useAuthStore()
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await api.post<{ access: string; refresh: string }>(
        '/auth/token/',
        input,
      )
      setTokens(data.access, data.refresh)
      const me = await api.get<UserDetail>('/users/me/')
      setUser(me.data)
      return me.data
    },
  })
}

export function useRegister() {
  const { setTokens, setUser } = useAuthStore()
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await api.post<{
        user: UserDetail
        access: string
        refresh: string
      }>('/auth/register/', input)
      setTokens(data.access, data.refresh)
      setUser(data.user)
      return data.user
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return () => {
    const { refresh, logout } = useAuthStore.getState()
    if (refresh) {
      api.post('/auth/logout/', { refresh }).catch(() => {})
    }
    logout()
    queryClient.clear()
    navigate('/login')
  }
}

/** Keeps the persisted user profile fresh. */
export function useMe() {
  const { access, setUser } = useAuthStore()
  return useQuery({
    queryKey: ['me'],
    enabled: access !== null,
    queryFn: async () => {
      const { data } = await api.get<UserDetail>('/users/me/')
      setUser(data)
      return data
    },
  })
}
