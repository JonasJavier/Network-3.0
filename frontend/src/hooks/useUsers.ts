import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { api, fetchPage } from '../lib/api'
import type {
  CountPage,
  FollowResponse,
  UserCard,
  UserDetail,
} from '../lib/types'
import { useAuthStore } from '../stores/auth'

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data } = await api.get<UserDetail>(`/users/${username}/`)
      return data
    },
  })
}

export function useSuggestions() {
  return useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const { data } = await api.get<UserCard[]>('/users/suggestions/')
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useSearchUsers(query: string) {
  return useInfiniteQuery({
    queryKey: ['user-search', query],
    enabled: query.trim().length > 0,
    queryFn: ({ pageParam }) =>
      fetchPage<CountPage<UserCard>>(
        pageParam ?? `/users/?search=${encodeURIComponent(query)}`,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next,
  })
}

export function useRelationList(username: string, relation: 'followers' | 'following') {
  return useInfiniteQuery({
    queryKey: ['relations', username, relation],
    queryFn: ({ pageParam }) =>
      fetchPage<CountPage<UserCard>>(pageParam ?? `/users/${username}/${relation}/`),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next,
  })
}

export function useFollow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      username,
      follow,
    }: {
      username: string
      follow: boolean
    }) => {
      const { data } = follow
        ? await api.post<FollowResponse>(`/users/${username}/follow/`)
        : await api.delete<FollowResponse>(`/users/${username}/follow/`)
      return data
    },
    onSuccess: (data, { username }) => {
      queryClient.setQueryData<UserDetail>(['profile', username], (profile) =>
        profile && {
          ...profile,
          is_following: data.is_following,
          followers_count: data.followers_count,
        },
      )
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['relations'] })
      queryClient.invalidateQueries({ queryKey: ['user-search'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({
        queryKey: ['posts', { feed: 'following' }],
      })
    },
  })
}

export interface ProfileUpdateInput {
  first_name?: string
  last_name?: string
  headline?: string
  bio?: string
  location?: string
  website?: string
  avatar?: File | null
  cover?: File | null
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { setUser } = useAuthStore()
  return useMutation({
    mutationFn: async (input: ProfileUpdateInput) => {
      const form = new FormData()
      for (const [key, value] of Object.entries(input)) {
        if (value === undefined || value === null) continue
        form.append(key, value)
      }
      const { data } = await api.patch<UserDetail>('/users/me/', form)
      return data
    },
    onSuccess: (user) => {
      setUser(user)
      queryClient.setQueryData(['me'], user)
      queryClient.setQueryData(['profile', user.username], user)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
